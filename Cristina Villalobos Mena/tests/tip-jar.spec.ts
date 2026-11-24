import { expect, test } from '@playwright/test'

test('updates the preview and restores the draft after reload', async ({ page }) => {
  await page.goto('/')

  const name = page.getByLabel('Nombre del creador')
  const message = page.getByLabel('Mensaje')
  const preview = page.getByRole('region', { name: 'Vista previa de tu buzón' })

  await name.fill('Ana')
  await message.fill('¡Gracias por apoyar mi arte!')

  await expect(preview.getByRole('heading', { name: 'Buzón de Ana' })).toBeVisible()
  await expect(preview.getByText('¡Gracias por apoyar mi arte!')).toBeVisible()

  await page.reload()

  await expect(name).toHaveValue('Ana')
  await expect(message).toHaveValue('¡Gracias por apoyar mi arte!')
  await expect(preview.getByRole('heading', { name: 'Buzón de Ana' })).toBeVisible()
  await expect(preview.getByText('¡Gracias por apoyar mi arte!')).toBeVisible()
})

test('shows the default card when the draft only contains spaces', async ({ page }) => {
  await page.goto('/')

  await page.getByLabel('Nombre del creador').fill('   ')
  await page.getByLabel('Mensaje').fill('   ')

  const preview = page.getByRole('region', { name: 'Vista previa de tu buzón' })

  await expect(preview.getByRole('heading', { name: 'Mi buzón de propinas' })).toBeVisible()
  await expect(preview.getByText('¡Gracias por apoyar lo que hago!')).toBeVisible()
  await expect(preview.getByRole('button', { name: 'Descargar tarjeta' })).toHaveCount(0)
})