/// Native macOS input listener using CGEventTap via raw FFI.
/// Replaces rdev on macOS to avoid crashes from rdev's outdated core-graphics dependency.
use std::os::raw::c_void;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::mpsc;

// ---------------------------------------------------------------------------
// CoreGraphics / CoreFoundation types & constants
// ---------------------------------------------------------------------------

#[repr(C)]
#[derive(Clone, Copy)]
struct CGPoint {
    x: f64,
    y: f64,
}

type CGEventTapProxy = *const c_void;
type CGEventRef = *const c_void;
type CGEventType = u32;
type CGEventMask = u64;
type CGEventField = u32;
type CGKeyCode = u16;
type CFMachPortRef = *const c_void;
type CFRunLoopSourceRef = *const c_void;
type CFRunLoopRef = *const c_void;
type CFStringRef = *const c_void;
type CFIndex = isize;
type CFAllocatorRef = *const c_void;

const K_CG_EVENT_KEY_DOWN: CGEventType = 10;
const K_CG_EVENT_KEY_UP: CGEventType = 11;
const K_CG_EVENT_FLAGS_CHANGED: CGEventType = 12;
const K_CG_EVENT_MOUSE_MOVED: CGEventType = 5;
const K_CG_EVENT_LEFT_MOUSE_DRAGGED: CGEventType = 6;
const K_CG_EVENT_RIGHT_MOUSE_DRAGGED: CGEventType = 7;
const K_CG_EVENT_OTHER_MOUSE_DRAGGED: CGEventType = 27;
// kCGEventTapDisabledByTimeout / kCGEventTapDisabledByUserInput
const K_CG_EVENT_TAP_DISABLED_BY_TIMEOUT: CGEventType = 0xFFFFFFFE;

const K_CG_KEYBOARD_EVENT_KEYCODE: CGEventField = 9;

const K_CG_EVENT_FLAG_MASK_ALPHA_SHIFT: u64 = 0x0001_0000; // CapsLock
const K_CG_EVENT_FLAG_MASK_SHIFT: u64 = 0x0002_0000;
const K_CG_EVENT_FLAG_MASK_CONTROL: u64 = 0x0004_0000;
const K_CG_EVENT_FLAG_MASK_ALTERNATE: u64 = 0x0008_0000;
const K_CG_EVENT_FLAG_MASK_COMMAND: u64 = 0x0010_0000;

const K_CG_HID_EVENT_TAP: u32 = 0;
const K_CG_HEAD_INSERT_EVENT_TAP: u32 = 0;
const K_CG_EVENT_TAP_OPTION_DEFAULT: u32 = 0;
const K_CG_EVENT_TAP_OPTION_LISTEN_ONLY: u32 = 1;

type CGEventTapCallBack = extern "C" fn(
    proxy: CGEventTapProxy,
    event_type: CGEventType,
    event: CGEventRef,
    user_info: *mut c_void,
) -> CGEventRef;

extern "C" {
    fn CGEventTapCreate(
        tap: u32,
        place: u32,
        options: u32,
        events_of_interest: CGEventMask,
        callback: CGEventTapCallBack,
        user_info: *mut c_void,
    ) -> CFMachPortRef;
    fn CGEventTapEnable(tap: CFMachPortRef, enable: bool);
    fn CGEventGetIntegerValueField(event: CGEventRef, field: CGEventField) -> i64;
    fn CGEventGetFlags(event: CGEventRef) -> u64;
    fn CGEventGetLocation(event: CGEventRef) -> CGPoint;
    fn CFMachPortCreateRunLoopSource(
        allocator: CFAllocatorRef,
        port: CFMachPortRef,
        order: CFIndex,
    ) -> CFRunLoopSourceRef;
    fn CFRunLoopGetMain() -> CFRunLoopRef;
    fn CFRunLoopAddSource(rl: CFRunLoopRef, source: CFRunLoopSourceRef, mode: CFStringRef);
    fn CFRunLoopRemoveSource(rl: CFRunLoopRef, source: CFRunLoopSourceRef, mode: CFStringRef);
    fn CFMachPortInvalidate(port: CFMachPortRef);

    static kCFRunLoopCommonModes: CFStringRef;
    static kCFAllocatorDefault: CFAllocatorRef;
}

// ---------------------------------------------------------------------------
// macOS keycode → rdev::Key mapping
// ---------------------------------------------------------------------------

fn keycode_to_rdev_key(keycode: CGKeyCode) -> rdev::Key {
    match keycode {
        0 => rdev::Key::KeyA,
        1 => rdev::Key::KeyS,
        2 => rdev::Key::KeyD,
        3 => rdev::Key::KeyF,
        4 => rdev::Key::KeyH,
        5 => rdev::Key::KeyG,
        6 => rdev::Key::KeyZ,
        7 => rdev::Key::KeyX,
        8 => rdev::Key::KeyC,
        9 => rdev::Key::KeyV,
        11 => rdev::Key::KeyB,
        12 => rdev::Key::KeyQ,
        13 => rdev::Key::KeyW,
        14 => rdev::Key::KeyE,
        15 => rdev::Key::KeyR,
        16 => rdev::Key::KeyY,
        17 => rdev::Key::KeyT,
        18 => rdev::Key::Num1,
        19 => rdev::Key::Num2,
        20 => rdev::Key::Num3,
        21 => rdev::Key::Num4,
        22 => rdev::Key::Num6,
        23 => rdev::Key::Num5,
        24 => rdev::Key::Unknown(24), // =+
        25 => rdev::Key::Num9,
        26 => rdev::Key::Num7,
        27 => rdev::Key::Unknown(27), // -_
        28 => rdev::Key::Num8,
        29 => rdev::Key::Num0,
        31 => rdev::Key::KeyO,
        32 => rdev::Key::KeyU,
        34 => rdev::Key::KeyI,
        35 => rdev::Key::KeyP,
        37 => rdev::Key::KeyL,
        38 => rdev::Key::KeyJ,
        40 => rdev::Key::KeyK,
        45 => rdev::Key::KeyN,
        46 => rdev::Key::KeyM,
        36 => rdev::Key::Return,
        48 => rdev::Key::Tab,
        49 => rdev::Key::Space,
        51 => rdev::Key::Backspace,
        53 => rdev::Key::Escape,
        54 => rdev::Key::MetaRight,
        55 => rdev::Key::MetaLeft,
        56 => rdev::Key::ShiftLeft,
        57 => rdev::Key::CapsLock,
        58 => rdev::Key::Alt,
        59 => rdev::Key::ControlLeft,
        60 => rdev::Key::ShiftRight,
        61 => rdev::Key::AltGr,
        62 => rdev::Key::ControlRight,
        // Function keys
        96 => rdev::Key::F5,
        97 => rdev::Key::F6,
        98 => rdev::Key::F7,
        99 => rdev::Key::F3,
        100 => rdev::Key::F8,
        101 => rdev::Key::F9,
        103 => rdev::Key::F11,
        109 => rdev::Key::F10,
        111 => rdev::Key::F12,
        118 => rdev::Key::F4,
        120 => rdev::Key::F2,
        122 => rdev::Key::F1,
        // Arrow keys
        123 => rdev::Key::LeftArrow,
        124 => rdev::Key::RightArrow,
        125 => rdev::Key::DownArrow,
        126 => rdev::Key::UpArrow,
        // Forward delete
        117 => rdev::Key::Delete,
        other => rdev::Key::Unknown(other as u32),
    }
}

// ---------------------------------------------------------------------------
// Modifier flag tracking for FlagsChanged events
// ---------------------------------------------------------------------------

/// Determine the flag mask corresponding to a given macOS keycode.
fn keycode_to_flag_mask(keycode: u16) -> Option<u64> {
    match keycode {
        57 => Some(K_CG_EVENT_FLAG_MASK_ALPHA_SHIFT), // CapsLock
        56 | 60 => Some(K_CG_EVENT_FLAG_MASK_SHIFT),  // Left/Right Shift
        59 | 62 => Some(K_CG_EVENT_FLAG_MASK_CONTROL), // Left/Right Control
        58 | 61 => Some(K_CG_EVENT_FLAG_MASK_ALTERNATE), // Left/Right Option
        55 | 54 => Some(K_CG_EVENT_FLAG_MASK_COMMAND), // Left/Right Command
        _ => None,
    }
}

fn flags_changed_to_rdev_events(
    keycode: u16,
    flags: u64,
    prev_flags: &AtomicU64,
) -> Vec<rdev::EventType> {
    let prev = prev_flags.swap(flags, Ordering::SeqCst);
    let key = keycode_to_rdev_key(keycode);

    let Some(mask) = keycode_to_flag_mask(keycode) else {
        return vec![];
    };

    let was_set = prev & mask != 0;
    let is_set = flags & mask != 0;

    if is_set && !was_set {
        vec![rdev::EventType::KeyPress(key)]
    } else if !is_set && was_set {
        vec![rdev::EventType::KeyRelease(key)]
    } else if keycode == 57 {
        // CapsLock is a toggle key on macOS. The physical key release sends a
        // FlagsChanged event with the SAME flag state (the lock flag doesn't
        // toggle back on release). Treat "no flag change" for CapsLock as a
        // KeyRelease so the radial menu's hold-to-show model works.
        vec![rdev::EventType::KeyRelease(key)]
    } else {
        vec![]
    }
}

// ---------------------------------------------------------------------------
// Callback & public listen function
// ---------------------------------------------------------------------------

struct CallbackContext {
    tap: CFMachPortRef,
    prev_flags: AtomicU64,
    event_filter: Box<dyn Fn(rdev::Event) -> bool + Send>,
}

extern "C" fn tap_callback(
    _proxy: CGEventTapProxy,
    event_type: CGEventType,
    event: CGEventRef,
    user_info: *mut c_void,
) -> CGEventRef {
    if user_info.is_null() || event.is_null() {
        return event;
    }

    // Re-enable tap if it was disabled by timeout
    if event_type == K_CG_EVENT_TAP_DISABLED_BY_TIMEOUT {
        let context = unsafe { &*(user_info as *const CallbackContext) };
        unsafe { CGEventTapEnable(context.tap, true) };
        return event;
    }

    let context = unsafe { &*(user_info as *const CallbackContext) };

    let rdev_events: Vec<rdev::EventType> = match event_type {
        K_CG_EVENT_KEY_DOWN => {
            let keycode =
                unsafe { CGEventGetIntegerValueField(event, K_CG_KEYBOARD_EVENT_KEYCODE) } as u16;
            vec![rdev::EventType::KeyPress(keycode_to_rdev_key(keycode))]
        }
        K_CG_EVENT_KEY_UP => {
            let keycode =
                unsafe { CGEventGetIntegerValueField(event, K_CG_KEYBOARD_EVENT_KEYCODE) } as u16;
            vec![rdev::EventType::KeyRelease(keycode_to_rdev_key(keycode))]
        }
        K_CG_EVENT_FLAGS_CHANGED => {
            let keycode =
                unsafe { CGEventGetIntegerValueField(event, K_CG_KEYBOARD_EVENT_KEYCODE) } as u16;
            let flags = unsafe { CGEventGetFlags(event) };
            flags_changed_to_rdev_events(keycode, flags, &context.prev_flags)
        }
        K_CG_EVENT_MOUSE_MOVED
        | K_CG_EVENT_LEFT_MOUSE_DRAGGED
        | K_CG_EVENT_RIGHT_MOUSE_DRAGGED
        | K_CG_EVENT_OTHER_MOUSE_DRAGGED => {
            let loc = unsafe { CGEventGetLocation(event) };
            vec![rdev::EventType::MouseMove { x: loc.x, y: loc.y }]
        }
        _ => vec![],
    };

    let mut suppress_current_event = false;

    for et in rdev_events {
        let rdev_event = rdev::Event {
            time: std::time::SystemTime::now(),
            name: None,
            event_type: et,
        };
        suppress_current_event |= (context.event_filter)(rdev_event);
    }

    if suppress_current_event {
        std::ptr::null()
    } else {
        event
    }
}

/// Wrapper to send raw pointers across threads via channels.
struct SendablePtr(*const c_void);
// SAFETY: The wrapped pointer is only used for CFRunLoopStop/CFMachPortInvalidate which are thread-safe.
unsafe impl Send for SendablePtr {}

/// Handle returned by `listen()` that allows stopping the CGEventTap.
/// Dropping the handle removes the source from the main run loop and frees resources.
pub struct ListenerHandle {
    run_loop: CFRunLoopRef,
    tap: CFMachPortRef,
    source: CFRunLoopSourceRef,
    context_ptr: *mut c_void,
}

// SAFETY: CFRunLoop/CFMachPort operations used here are thread-safe.
unsafe impl Send for ListenerHandle {}
unsafe impl Sync for ListenerHandle {}

impl Drop for ListenerHandle {
    fn drop(&mut self) {
        unsafe {
            CGEventTapEnable(self.tap, false);
            CFRunLoopRemoveSource(self.run_loop, self.source, kCFRunLoopCommonModes);
            CFMachPortInvalidate(self.tap);
            if !self.context_ptr.is_null() {
                drop(Box::from_raw(self.context_ptr as *mut CallbackContext));
            }
        }
    }
}

struct SetupOk {
    tap: SendablePtr,
    source: SendablePtr,
    context_ptr: SendablePtr,
}

/// Start a native CGEventTap listener.
/// Returns a Receiver that yields `rdev::Event` values and a `ListenerHandle` for cleanup.
/// The event tap is added to the **main** CFRunLoop (already running via Tauri/Cocoa)
/// to avoid IMK mach port errors that occur with background-thread run loops.
pub fn listen() -> Result<(mpsc::Receiver<rdev::Event>, ListenerHandle), String> {
    let (tx, rx) = mpsc::channel();
    let handle = listen_with_options(K_CG_EVENT_TAP_OPTION_LISTEN_ONLY, move |event| {
        let _ = tx.send(event);
        false
    })?;
    Ok((rx, handle))
}

/// Start a native CGEventTap listener that can suppress events.
/// The callback should return true to prevent the original event from reaching other apps.
pub fn listen_with_filter<F>(event_filter: F) -> Result<ListenerHandle, String>
where
    F: Fn(rdev::Event) -> bool + Send + 'static,
{
    listen_with_options(K_CG_EVENT_TAP_OPTION_DEFAULT, event_filter)
}

fn listen_with_options<F>(tap_options: u32, event_filter: F) -> Result<ListenerHandle, String>
where
    F: Fn(rdev::Event) -> bool + Send + 'static,
{
    let (setup_tx, setup_rx) = mpsc::channel::<Result<SetupOk, String>>();

    std::thread::spawn(move || unsafe {
        let context = Box::new(CallbackContext {
            tap: std::ptr::null(),
            prev_flags: AtomicU64::new(0),
            event_filter: Box::new(event_filter),
        });
        let context_ptr = Box::into_raw(context) as *mut c_void;

        let mask: CGEventMask = (1 << K_CG_EVENT_KEY_DOWN)
            | (1 << K_CG_EVENT_KEY_UP)
            | (1 << K_CG_EVENT_FLAGS_CHANGED)
            | (1 << K_CG_EVENT_MOUSE_MOVED)
            | (1 << K_CG_EVENT_LEFT_MOUSE_DRAGGED)
            | (1 << K_CG_EVENT_RIGHT_MOUSE_DRAGGED)
            | (1 << K_CG_EVENT_OTHER_MOUSE_DRAGGED);

        let tap = CGEventTapCreate(
            K_CG_HID_EVENT_TAP,
            K_CG_HEAD_INSERT_EVENT_TAP,
            tap_options,
            mask,
            tap_callback,
            context_ptr,
        );

        if tap.is_null() {
            drop(Box::from_raw(context_ptr as *mut CallbackContext));
            let _ = setup_tx.send(Err(
                "Failed to create CGEventTap. Grant Accessibility permission in System Settings."
                    .into(),
            ));
            return;
        }

        // Store the tap pointer so the callback can re-enable the tap on timeout
        (*(context_ptr as *mut CallbackContext)).tap = tap;

        let source = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0);
        if source.is_null() {
            drop(Box::from_raw(context_ptr as *mut CallbackContext));
            let _ = setup_tx.send(Err("Failed to create CFRunLoopSource".into()));
            return;
        }

        // Add to the MAIN run loop (already running via Tauri/Cocoa).
        // This avoids "error messaging the mach port for IMKCFRunLoopWakeUpReliable"
        // which occurs when the event tap runs on a background thread's run loop.
        let run_loop = CFRunLoopGetMain();
        CFRunLoopAddSource(run_loop, source, kCFRunLoopCommonModes);
        CGEventTapEnable(tap, true);

        // Signal success. The context_ptr ownership is transferred to ListenerHandle.
        // The spawned thread exits here; the main run loop drives callbacks.
        let _ = setup_tx.send(Ok(SetupOk {
            tap: SendablePtr(tap),
            source: SendablePtr(source),
            context_ptr: SendablePtr(context_ptr),
        }));
    });

    match setup_rx.recv() {
        Ok(Ok(ok)) => {
            let run_loop = unsafe { CFRunLoopGetMain() };
            Ok(ListenerHandle {
                run_loop,
                tap: ok.tap.0,
                source: ok.source.0,
                context_ptr: ok.context_ptr.0 as *mut c_void,
            })
        }
        Ok(Err(e)) => Err(e),
        Err(_) => Err("CGEventTap setup thread terminated unexpectedly".into()),
    }
}
