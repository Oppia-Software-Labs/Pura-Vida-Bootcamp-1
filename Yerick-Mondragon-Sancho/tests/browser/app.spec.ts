import { expect, test } from "@playwright/test";

test("abre sin conectar, no muestra saldos y respeta el ancho de pantalla", async ({
  page,
}) => {
  const errors: string[] = [];
  const balanceRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.url().includes("horizon")) balanceRequests.push(request.url());
  });
  await page.goto("/");
  await expect(page).toHaveTitle(/Stellar Odyssey/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Su primera órbita",
  );
  await expect(
    page.getByRole("button", { name: "Conecte su wallet", exact: true }),
  ).toHaveCount(2);
  await expect(page.locator(".public-address")).toHaveCount(0);
  await expect(page.locator(".balance-value")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(balanceRequests).toEqual([]);
  expect(errors).toEqual([]);
  await page
    .getByText("Diseñado y desarrollado por", { exact: false })
    .scrollIntoViewIfNeeded();
  await expect(page.locator(".personal-signature")).toContainText(
    "Diseñado y desarrollado por Yerick M.",
  );
  expect(
    await page.locator(".personal-signature").evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth;
    }),
  ).toBe(true);
  await page
    .getByRole("heading", { name: "Prepare su wallet" })
    .scrollIntoViewIfNeeded();
  await expect(page.locator(".step").first()).toHaveCSS("opacity", "1");
});

test("muestra un error honesto sin extensión y permite instalarla", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".panel-connect").click();
  await expect(page.getByRole("alert")).toContainText("No encontramos Varial", {
    timeout: 15000,
  });
  await expect(
    page.getByRole("link", { name: "Instalar Varial" }),
  ).toHaveAttribute("href", "https://varialwallet.com");
  await expect(page.locator(".balance-value")).toHaveCount(0);
  await expect(page.locator(".panel-connect")).toBeEnabled();
});

test("permite pausar el fondo y respeta movimiento reducido", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Pausar animación de fondo" }).click();
  await expect(
    page.getByRole("button", { name: "Activar animación de fondo" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".mountain-distant")).toHaveCSS(
    "transform",
    "none",
  );
  await expect(page.locator(".ring-two")).toHaveCSS("animation-name", "none");
  await page
    .getByRole("button", { name: "Activar animación de fondo" })
    .click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByText("Movimiento reducido", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".motion-toggle")).toBeDisabled();
  await expect(page.locator(".mountain-distant")).toHaveCSS(
    "transform",
    "none",
  );
  await expect(page.locator(".ring-two")).toHaveCSS("animation-name", "none");
});
