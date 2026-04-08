import { TextDecoder, TextEncoder } from "util";
import { vi } from "vitest";

global.console = {
    error: console.error,
    info: console.info,
    log: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
};

// Polyfill for encoding which isn't present globally in jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
