import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validatePassword,
  validateDisplayName,
  validatePasswordMatch,
} from "./validation";

describe("validateEmail", () => {
  it("accepts valid email addresses", () => {
    expect(validateEmail("test@example.com")).toEqual({ valid: true });
    expect(validateEmail("user.name@domain.co.uk")).toEqual({ valid: true });
    expect(validateEmail("test+tag@gmail.com")).toEqual({ valid: true });
  });

  it("rejects invalid email addresses", () => {
    expect(validateEmail("invalid")).toEqual({
      valid: false,
      error: "Enter a valid email address",
    });
    expect(validateEmail("@example.com")).toEqual({
      valid: false,
      error: "Enter a valid email address",
    });
    expect(validateEmail("test@")).toEqual({
      valid: false,
      error: "Enter a valid email address",
    });
  });

  it("rejects empty email", () => {
    expect(validateEmail("")).toEqual({
      valid: false,
      error: "Email is required",
    });
    expect(validateEmail("   ")).toEqual({
      valid: false,
      error: "Email is required",
    });
  });

  it("trims whitespace", () => {
    expect(validateEmail("  test@example.com  ")).toEqual({ valid: true });
  });
});

describe("validatePassword", () => {
  it("accepts valid passwords", () => {
    expect(validatePassword("password123")).toEqual({ valid: true });
    expect(validatePassword("12345678")).toEqual({ valid: true });
    expect(validatePassword("VeryLongPasswordWithManyCharacters")).toEqual({ valid: true });
  });

  it("rejects short passwords", () => {
    expect(validatePassword("short")).toEqual({
      valid: false,
      error: "Password must be at least 8 characters",
    });
    expect(validatePassword("1234567")).toEqual({
      valid: false,
      error: "Password must be at least 8 characters",
    });
  });

  it("rejects empty password", () => {
    expect(validatePassword("")).toEqual({
      valid: false,
      error: "Password is required",
    });
  });
});

describe("validateDisplayName", () => {
  it("accepts valid names", () => {
    expect(validateDisplayName("John Doe")).toEqual({ valid: true });
    expect(validateDisplayName("Alice")).toEqual({ valid: true });
    expect(validateDisplayName("名前")).toEqual({ valid: true });
  });

  it("rejects too short names", () => {
    expect(validateDisplayName("A")).toEqual({
      valid: false,
      error: "Name must be at least 2 characters",
    });
  });

  it("rejects too long names", () => {
    const longName = "A".repeat(51);
    expect(validateDisplayName(longName)).toEqual({
      valid: false,
      error: "Name must be less than 50 characters",
    });
  });

  it("rejects empty name", () => {
    expect(validateDisplayName("")).toEqual({
      valid: false,
      error: "Name is required",
    });
    expect(validateDisplayName("   ")).toEqual({
      valid: false,
      error: "Name is required",
    });
  });

  it("trims whitespace", () => {
    expect(validateDisplayName("  John Doe  ")).toEqual({ valid: true });
  });
});

describe("validatePasswordMatch", () => {
  it("accepts matching passwords", () => {
    expect(validatePasswordMatch("password123", "password123")).toEqual({ valid: true });
  });

  it("rejects non-matching passwords", () => {
    expect(validatePasswordMatch("password123", "different123")).toEqual({
      valid: false,
      error: "Passwords don't match",
    });
  });

  it("is case sensitive", () => {
    expect(validatePasswordMatch("Password", "password")).toEqual({
      valid: false,
      error: "Passwords don't match",
    });
  });
});
