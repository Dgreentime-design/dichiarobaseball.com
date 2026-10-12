/* ==========================================================================
   What a Contact enquiry is about.

   Buttons across the site open contact.html?about=<slug>. Each known slug
   preselects one of the topics on the Contact form and is stored with the
   enquiry. Program slugs come from data/programs.json, so a new program is
   known the moment it is in the data. Any other slug is ignored.

   Shared by build.mjs, which writes the map into the Contact page, and by
   /api/enquiry, which stores `about` only when it is a key here.
   ========================================================================== */

import { readFileSync } from "node:fs";

const DATA = JSON.parse(readFileSync(new URL("../../data/programs.json", import.meta.url), "utf8"));

export const TOPICS = ["Camps and clinics", "Private lessons", "Cage or facility rental", "Team booking", "Something else"];

const FIXED = {
  "hittrax": "Cage or facility rental",
  "rental": "Cage or facility rental",
  "cage-rental": "Cage or facility rental",
  "full-facility": "Cage or facility rental",
  "lesson": "Private lessons",
  "private-lesson": "Private lessons",
  "pitching-lesson": "Private lessons",
  "semi-private": "Private lessons",
  "spring-little-league": "Camps and clinics"
};

export const ABOUT_TOPICS = {
  ...FIXED,
  ...Object.fromEntries(DATA.programs.map((p) => [p.slug, p.gated ? "Team booking" : "Camps and clinics"]))
};
