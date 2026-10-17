import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { MysteryPoster } from "./MysteryPoster";

describe("MysteryPoster", () => {
  afterEach(() => cleanup());

  it("renders an <img> with the poster url and blur style when url present", () => {
    const { container } = render(
      <MysteryPoster posterUrl="/x.png" blurPx={12} alt="Mystery poster" />,
    );
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain("/x.png");
    expect(img.style.filter).toBe("blur(12px)");
    expect(img.getAttribute("alt")).toBe("Mystery poster");
  });

  it("renders the SVG fallback (not an <img>) when posterUrl is null", () => {
    const { container } = render(
      <MysteryPoster posterUrl={null} blurPx={0} alt="Mystery poster" />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".bw-poster-fallback")).toBeTruthy();
  });

  it("has blur 0 when posterUrl is present but blurPx=0 (win state)", () => {
    const { container } = render(
      <MysteryPoster posterUrl="/x.png" blurPx={0} alt="Today's poster" />,
    );
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img.style.filter).toBe("blur(0px)");
  });

  it("has the star-corner frame wrapper (.bw-mystery-poster)", () => {
    const { container } = render(
      <MysteryPoster posterUrl="/x.png" blurPx={10} alt="t" />,
    );
    expect(container.querySelector(".bw-mystery-poster")).toBeTruthy();
  });
});
