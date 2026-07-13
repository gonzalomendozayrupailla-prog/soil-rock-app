import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE = 'http://localhost:3000';
const OUT = './audit-screenshots';
mkdirSync(OUT, { recursive: true });

const issues = [];
let idx = 0;

async function shot(page, label) {
  const f = join(OUT, String(idx++).padStart(2,'0') + '-' + label + '.png');
  await page.screenshot({ path: f, fullPage: true });
  console.log('📸', label);
}
function log(type, msg) {
  issues.push({ type, msg });
  const icon = { ERROR:'❌', WARN:'⚠️ ', OK:'✅', INFO:'ℹ️ ' }[type] || '  ';
  console.log(`${icon} [${type}] ${msg}`);
}
async function vis(loc, t = 2000) {
  return loc.isVisible({ timeout: t }).catch(() => false);
}

// Navega con click en sidebar o con la API de request context
async function navSidebar(page, text) {
  const link = page.locator(`a:has-text("${text}"), nav a:has-text("${text}")`).first();
  if (await vis(link, 2000)) {
    await link.click();
    await page.waitForLoadState('networkidle');
    return true;
  }
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // Hacer el login via fetch API del browser context (maneja cookies correctamente)
  const apiCtx = ctx.request;
  const loginRes = await apiCtx.post(`${BASE}/api/auth/login`, {
    data: { correo: 'anthony@soilrock.pe', password: 'soilrock123' },
    headers: { 'Content-Type': 'application/json' },
  });

  if (!loginRes.ok()) {
    console.error('❌ Login API falló:', loginRes.status(), await loginRes.text());
    await browser.close();
    process.exit(1);
  }

  // Extraer cookie del header y agregarla al contexto del browser
  const setCookieHeader = loginRes.headers()['set-cookie'];
  console.log('Set-Cookie recibido:', setCookieHeader ? 'SI' : 'NO');

  if (setCookieHeader) {
    // Parsear la cookie y agregarla al contexto
    const tokenMatch = setCookieHeader.match(/token=([^;]+)/);
    if (tokenMatch) {
      await ctx.addCookies([{
        name: 'token',
        value: tokenMatch[1],
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      }]);
      console.log('✅ Cookie "token" inyectada en el contexto del browser');
    }
  }

  const page = await ctx.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') log('JS_ERR', msg.text().slice(0, 200));
  });
  page.on('pageerror', e => log('PAGE_ERR', e.message.slice(0, 200)));

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  console.log('\n=== DASHBOARD ===');
  await page.goto(`${BASE}/dashboard`);
  await page.waitForLoadState('networkidle');
  await shot(page, '01-dashboard');
  console.log('URL:', page.url());

  if (page.url().includes('login')) {
    log('ERROR', 'La cookie no funciona - middleware rechaza la sesión incluso con token válido');
    // Intentar login manual como fallback
    await page.locator('input[type="email"]').fill('anthony@soilrock.pe');
    await page.locator('input[type="password"]').fill('soilrock123');
    await page.locator('button[type="button"]').first().click();
    await page.waitForTimeout(3000);
    await shot(page, '01b-login-manual');
    console.log('URL post-login manual:', page.url());
    if (page.url().includes('login')) {
      log('ERROR', 'No se puede entrar al sistema. Deteniendo audit.');
      await browser.close();
      process.exit(1);
    }
  }

  log('OK', `Dashboard cargado → ${page.url()}`);
  await shot(page, '02-dashboard-ok');

  // ── PIPELINE ──────────────────────────────────────────────────────────────
  console.log('\n=== PIPELINE ===');
  const pipelineOk = await navSidebar(page, 'Pipeline');
  if (!pipelineOk) {
    await page.goto(`${BASE}/dashboard/pipeline`);
    await page.waitForLoadState('networkidle');
  }
  await shot(page, '03-pipeline-kanban');
  console.log('URL:', page.url());

  // Verificar columnas kanban
  for (const col of ['Contacto', 'Propuesta', 'Negociación', 'Adjudicado']) {
    const found = await vis(page.locator(`text="${col}"`).first(), 3000);
    if (found) log('OK', `Columna kanban "${col}" visible`);
    else log('WARN', `Columna kanban "${col}" NO visible`);
  }

  // En pausa
  if (await vis(page.locator('text="En pausa"').first(), 2000))
    log('OK', 'Sección "En pausa" visible');
  else log('WARN', 'Sección "En pausa" NO encontrada');

  // PRUEBA 1: clic en tarjeta
  console.log('\n--- PRUEBA 1: clic en tarjeta kanban ---');
  const cardSels = [
    '[draggable="true"]',
    '[class*="kanban"] [class*="card"]',
    '[class*="oportunidad"]',
    'a[href*="pipeline/"]',
    '[class*="pipeline"] [class*="item"]',
  ];
  let cardClicked = false;
  for (const sel of cardSels) {
    const el = page.locator(sel).first();
    if (await vis(el, 1500)) {
      const txt = await el.textContent().catch(() => '?');
      console.log(`  Tarjeta: "${txt?.trim().slice(0,50)}" (${sel})`);
      await el.click();
      await page.waitForLoadState('networkidle');
      await shot(page, '04-pipeline-card-detalle');
      console.log('  URL:', page.url());

      // Tabs disponibles
      const tabs = page.locator('[role="tab"], button[class*="tab"]');
      const n = await tabs.count();
      const names = [];
      for (let i=0; i<n; i++) names.push((await tabs.nth(i).textContent()).trim());
      console.log(`  Tabs: ${names.join(' | ')}`);

      for (const t of ['Info','Documentos','Actividad']) {
        if (names.some(nm => nm.includes(t))) log('OK', `Tab "${t}" presente en oportunidad`);
        else log('WARN', `Tab "${t}" NO existe en oportunidad`);
      }

      // Screenshot de cada tab
      for (const name of names) {
        const te = page.locator(`[role="tab"]:has-text("${name}"), button[class*="tab"]:has-text("${name}")`).first();
        if (await vis(te, 800)) {
          await te.click();
          await page.waitForTimeout(500);
          const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-');
          await shot(page, `05-oportunidad-tab-${slug}`);
        }
      }
      cardClicked = true;
      break;
    }
  }
  if (!cardClicked) {
    log('WARN', 'Kanban vacío — no hay oportunidades creadas para testear');
    await shot(page, '04-pipeline-vacio');
  }

  // PRUEBA 2: marcar como perdida
  console.log('\n--- PRUEBA 2: marcar como perdida ---');
  if (cardClicked) {
    let found = false;
    for (const sel of ['select[name*="fase"]','select','button:has-text("Perdido")','button:has-text("Cancelar")']) {
      const el = page.locator(sel).first();
      if (await vis(el, 1500)) {
        console.log(`  Control de fase: ${sel}`);
        if (sel.startsWith('select')) {
          const opts = await el.locator('option').allTextContents();
          console.log(`  Opciones: ${opts.join(', ')}`);
          if (opts.some(o => /cancelado|perdido/i.test(o))) log('OK', 'Opción cancelado/perdido en selector');
          else log('WARN', 'Sin opción cancelado/perdido en selector de fase');
        }
        await shot(page, '06-oportunidad-control-fase');
        found = true;
        break;
      }
    }
    if (!found) log('WARN', 'No hay control para marcar oportunidad como perdida/cancelada');
  }

  // Volver al pipeline y verificar cancelados
  await navSidebar(page, 'Pipeline');
  if (await vis(page.locator('text="Cancelado"').first(), 2000))
    log('OK', 'Sección "Cancelado" visible en Pipeline');
  else log('WARN', 'Oportunidades canceladas no tienen sección visible en Pipeline');

  // ── PROYECTOS ─────────────────────────────────────────────────────────────
  console.log('\n=== PROYECTOS ===');
  const projOk = await navSidebar(page, 'Proyectos');
  if (!projOk) {
    await page.goto(`${BASE}/dashboard/proyectos`);
    await page.waitForLoadState('networkidle');
  }
  await shot(page, '07-proyectos-lista');

  // Seleccionar primer proyecto real (no el botón "Nuevo")
  const projSels = [
    'a[href*="/proyectos/"]:not([href*="nuevo"])',
    '[class*="proyecto-item"]',
    'aside li a',
    '[class*="list"] [class*="item"] a',
  ];
  let projClicked = false;
  for (const sel of projSels) {
    const el = page.locator(sel).first();
    if (await vis(el, 1500)) {
      const txt = await el.textContent().catch(() => '?');
      console.log(`  Proyecto: "${txt?.trim().slice(0,60)}" (${sel})`);
      await el.click();
      await page.waitForLoadState('networkidle');
      await shot(page, '08-proyecto-detalle');
      console.log('  URL:', page.url());
      projClicked = true;
      break;
    }
  }
  if (!projClicked) {
    log('WARN', 'No hay proyectos en la lista (adjudicado o posterior)');
    await shot(page, '08-proyectos-vacio');
  } else {
    // PRUEBA 3: cancelar proyecto
    console.log('\n--- PRUEBA 3: cancelar proyecto ---');
    const cancelBtn = page.locator('button:has-text("Cancelar proyecto"), button:has-text("Cancelar"), select').first();
    if (await vis(cancelBtn, 2000)) {
      log('OK', 'Control para cancelar proyecto encontrado');
      await shot(page, '09-proyecto-cancelar');
    } else {
      log('WARN', 'NO hay botón/control para cancelar proyecto desde ejecución');
    }

    // Verificar que cancelados no aparezcan mezclados con la lista
    await navSidebar(page, 'Proyectos');
    if (await vis(page.locator('text="Cancelado"').first(), 1500))
      log('INFO', 'Proyectos cancelados aparecen en la lista de proyectos');
    else log('INFO', 'Proyectos cancelados NO aparecen en lista (correcto — solo adjudicado+)');

    // Volver al proyecto
    for (const sel of projSels) {
      const el = page.locator(sel).first();
      if (await vis(el, 1000)) { await el.click(); await page.waitForLoadState('networkidle'); break; }
    }

    // PRUEBA 4: editar avance %
    console.log('\n--- PRUEBA 4: editar avance % ---');
    let avanceOk = false;
    for (const s of ['input[type="range"]','input[name*="avance"]','input[placeholder*="%"]']) {
      if (await vis(page.locator(s).first(), 1500)) {
        log('OK', `Avance % editable directamente (${s})`);
        avanceOk = true;
        await shot(page, '10-proyecto-avance-input');
        break;
      }
    }
    if (!avanceOk) {
      const editBtn = page.locator('button:has-text("Editar")').first();
      if (await vis(editBtn, 1500)) {
        await editBtn.click();
        await page.waitForTimeout(400);
        await shot(page, '10-proyecto-modo-edicion');
        for (const s of ['input[type="range"]','input[name*="avance"]','input[placeholder*="%"]']) {
          if (await vis(page.locator(s).first(), 1500)) {
            log('OK', `Avance % en modo edición (${s})`);
            avanceOk = true; break;
          }
        }
        if (!avanceOk) log('WARN', 'No hay input de avance % ni en modo edición');
        const ce = page.locator('button:has-text("Cancelar")').first();
        if (await vis(ce, 800)) await ce.click();
      } else {
        log('WARN', 'No hay forma de editar avance % del proyecto');
        await shot(page, '10-proyecto-sin-avance');
      }
    }

    // PRUEBA 5: editar fechas
    console.log('\n--- PRUEBA 5: editar fechas ---');
    const fechaEl = page.locator('input[type="date"]').first();
    if (await vis(fechaEl, 2000)) {
      log('OK', 'Input de fecha editable visible directamente');
      await shot(page, '11-proyecto-fecha');
    } else {
      const eb = page.locator('button:has-text("Editar")').first();
      if (await vis(eb, 1500)) {
        await eb.click();
        await page.waitForTimeout(400);
        if (await vis(page.locator('input[type="date"]').first(), 2000)) {
          log('OK', 'Input de fecha en modo edición');
          await shot(page, '11-proyecto-fecha-edicion');
        } else {
          log('WARN', 'No hay input de fecha ni en modo edición');
          await shot(page, '11-proyecto-sin-fecha');
        }
        const ce = page.locator('button:has-text("Cancelar")').first();
        if (await vis(ce, 800)) await ce.click();
      } else {
        log('WARN', 'No hay input de fecha editable ni botón Editar');
        await shot(page, '11-proyecto-sin-fecha');
      }
    }

    // Tabs del proyecto
    console.log('\n--- TABS DEL PROYECTO ---');
    for (const tab of ['Info','Documentos','Actividad','Campo','Valorizaciones','Facturación']) {
      const te = page.locator(`button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`).first();
      if (await vis(te, 1500)) {
        await te.click();
        await page.waitForTimeout(500);
        const slug = tab.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        await shot(page, `12-tab-${slug}`);
        log('OK', `Tab "${tab}" funciona`);
      } else {
        log('WARN', `Tab "${tab}" NO visible en proyecto`);
      }
    }

    // Verificar ingenieros
    console.log('\n--- INGENIEROS ASIGNADOS ---');
    const ingEl = page.locator('text="Ingeniero", text="Ing. Residente", [name*="ingeniero"]').first();
    if (await vis(ingEl, 2000)) {
      log('OK', 'Campo de ingeniero visible en proyecto');
      await shot(page, '13-proyecto-ingeniero');
    } else {
      log('WARN', 'Campo de ingeniero no visible en la UI del proyecto');
    }
    log('INFO', 'PENDIENTE NEGOCIO: Schema solo tiene 1 campo ingeniero_id. Si un proyecto puede tener varios ingenieros, se necesita tabla proyecto_ingenieros.');
  }

  // ── CLIENTES ──────────────────────────────────────────────────────────────
  console.log('\n=== CLIENTES ===');
  await navSidebar(page, 'Clientes');
  await shot(page, '14-clientes');

  // ── RESUMEN ───────────────────────────────────────────────────────────────
  console.log('\n\n══════════════ RESUMEN FINAL ══════════════');
  for (const [type, icon] of [['ERROR','❌'],['WARN','⚠️ '],['JS_ERR','🔴'],['INFO','ℹ️ ']]) {
    const list = issues.filter(i => i.type === type);
    if (list.length) {
      console.log(`\n${icon} ${type} (${list.length}):`);
      list.forEach(i => console.log(`   • ${i.msg}`));
    }
  }

  writeFileSync(join(OUT, 'report.json'), JSON.stringify(issues, null, 2));
  console.log(`\n📁 Screenshots: ${OUT}`);
  await browser.close();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
