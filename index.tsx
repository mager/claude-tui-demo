import React from "react";
import { render } from "ink";
import { App } from "./App.js";

const prompt = process.argv.slice(2).join(" ") || "What files are in this directory?";

render(<App prompt={prompt} />);
