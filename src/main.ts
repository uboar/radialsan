import { mount } from "svelte";
import App from "./App.svelte";
import "./index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element #root was not found");
}

mount(App, { target: root });
