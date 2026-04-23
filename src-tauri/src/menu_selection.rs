use serde::Serialize;

#[derive(Debug, Clone)]
pub struct MenuSelectionContext {
    pub menu_id: String,
    pub origin_x: f64,
    pub origin_y: f64,
    pub slice_count: usize,
    pub dead_zone_radius: f64,
    pub selected_index: Option<usize>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MenuSelectionSnapshot {
    pub menu_id: String,
    pub selected_index: Option<usize>,
}

impl MenuSelectionContext {
    pub fn new(
        menu_id: String,
        origin_x: f64,
        origin_y: f64,
        slice_count: usize,
        dead_zone_radius: f64,
    ) -> Self {
        Self {
            menu_id,
            origin_x,
            origin_y,
            slice_count,
            dead_zone_radius,
            selected_index: None,
        }
    }

    pub fn update_cursor(&mut self, x: f64, y: f64) -> Option<usize> {
        self.selected_index = selected_index_for_movement(
            self.origin_x,
            self.origin_y,
            x,
            y,
            self.slice_count,
            self.dead_zone_radius,
        );
        self.selected_index
    }

    pub fn snapshot(&self) -> MenuSelectionSnapshot {
        MenuSelectionSnapshot {
            menu_id: self.menu_id.clone(),
            selected_index: self.selected_index,
        }
    }
}

pub fn selected_index_for_movement(
    origin_x: f64,
    origin_y: f64,
    x: f64,
    y: f64,
    slice_count: usize,
    dead_zone_radius: f64,
) -> Option<usize> {
    if slice_count == 0 {
        return None;
    }

    let dx = x - origin_x;
    let dy = y - origin_y;
    let dist = (dx * dx + dy * dy).sqrt();
    if dist <= dead_zone_radius.max(0.0) {
        return None;
    }

    let angle = angle_from_delta(dx, dy);
    Some(slice_index_from_angle(angle, slice_count))
}

fn angle_from_delta(dx: f64, dy: f64) -> f64 {
    // Coordinate system matches the canvas renderer: 0 radians is up,
    // increasing clockwise.
    dx.atan2(-dy).rem_euclid(std::f64::consts::TAU)
}

fn slice_index_from_angle(angle: f64, slice_count: usize) -> usize {
    let slice_width = std::f64::consts::TAU / slice_count as f64;
    let shifted = (angle + slice_width / 2.0).rem_euclid(std::f64::consts::TAU);
    (shifted / slice_width).floor() as usize % slice_count
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn movement_direction_maps_to_cardinal_slices() {
        assert_eq!(
            selected_index_for_movement(0.0, 0.0, 0.0, -50.0, 4, 10.0),
            Some(0)
        );
        assert_eq!(
            selected_index_for_movement(0.0, 0.0, 50.0, 0.0, 4, 10.0),
            Some(1)
        );
        assert_eq!(
            selected_index_for_movement(0.0, 0.0, 0.0, 50.0, 4, 10.0),
            Some(2)
        );
        assert_eq!(
            selected_index_for_movement(0.0, 0.0, -50.0, 0.0, 4, 10.0),
            Some(3)
        );
    }

    #[test]
    fn movement_beyond_menu_radius_still_selects_by_direction() {
        assert_eq!(
            selected_index_for_movement(100.0, 100.0, 100.0, -1000.0, 4, 30.0),
            Some(0)
        );
    }

    #[test]
    fn movement_inside_dead_zone_does_not_select() {
        assert_eq!(
            selected_index_for_movement(0.0, 0.0, 0.0, -10.0, 4, 30.0),
            None
        );
        assert_eq!(
            selected_index_for_movement(0.0, 0.0, 0.0, -30.0, 4, 30.0),
            None
        );
    }

    #[test]
    fn zero_slices_never_selects() {
        assert_eq!(
            selected_index_for_movement(0.0, 0.0, 0.0, -50.0, 0, 10.0),
            None
        );
    }

    #[test]
    fn slice_boundaries_match_frontend_geometry() {
        let slice_width = std::f64::consts::TAU / 4.0;
        let just_before = slice_width / 2.0 - 0.0001;
        let just_after = slice_width / 2.0 + 0.0001;

        assert_eq!(slice_index_from_angle(just_before, 4), 0);
        assert_eq!(slice_index_from_angle(just_after, 4), 1);
    }
}
