/**
 * Platform detection utility.
 * Determines if running as native Capacitor app or in browser.
 */
import { Capacitor } from "@capacitor/core";

export const isNativePlatform = (): boolean => Capacitor.isNativePlatform();

export const getPlatform = (): "android" | "ios" | "web" => {
  return Capacitor.getPlatform() as "android" | "ios" | "web";
};
