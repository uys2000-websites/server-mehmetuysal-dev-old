import {
  colListener,
  docListener,
  getDoc,
  setDoc,
  updateDoc,
} from "../services/firebase.mjs";
import { Settings } from "../classes/settings.mjs";

import { PROJECTSETTINGS, SETTINGS } from "../keys/constants.mjs";
import { updateProject } from "./updater.mjs";
import { error } from "../services/logger.mjs";
import { runCommand } from "../services/command.mjs";

/**
 * @typedef {import('../classes/settings.mjs').ProjectSettings} ProjectSettings
 */

/**
 * @param {string} reason
 */
export const errorThrower = async function (reason) {
  await error("Function", "Err", "errorThrower", reason);
  if (globalThis.reboot) runCommand("sleep 6 && sudo reboot &");
  else throw new Error(reason);
};

/**
 * @returns {Promise<Settings>}
 */
export const settingsLoader = async function () {
  const snapshot = await getDoc(SETTINGS, SETTINGS);
  let settings = new Settings();
  if (!snapshot.exists) setDoc(SETTINGS, SETTINGS, settings);
  else settings = snapshot.data();
  return settings;
};

/**
 * @param {Settings} settings
 * @param {boolean} pass
 */
export const settingsController = async function (settings, pass = false) {
  if (settings.connected && !pass) errorThrower("There is existing connection");
  else await updateDoc(SETTINGS, SETTINGS, { connected: true });
};

/**
 *
 */
export const settingsListener = function () {
  return docListener(SETTINGS, SETTINGS, async (snapshot) => {
    if (!snapshot.exists) await errorThrower("Settings removed");
    const data = snapshot.data();
    if (!data.connected) await errorThrower("Connection status changed");
  });
};

/**
 *
 */
export const projectListener = function () {
  return colListener(PROJECTSETTINGS, (snapshots) => {
    snapshots.docs.forEach(async (snapshot) => {
      if (!snapshot.exists) await errorThrower("Project Not Exists");
      const data = snapshot.data();
      if (data.outdated) {
        updateProject(data);
        updateDoc(PROJECTSETTINGS, snapshot.id, { outdated: false });
      }
    });
  });
};
