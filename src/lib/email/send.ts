const RESEND_API_URL = 'https://api.resend.com/emails';

function getFrom() {
  return process.env.EMAIL_FROM?.trim() || 'Garazio <noreply@garazio.cz>';
}

export async function sendEmail(input: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY is not configured');
    return false;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getFrom(),
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[email] Resend returned ${response.status}: ${body}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[email] Failed to contact Resend', error);
    return false;
  }
}

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://garazio.cz').replace(/\/$/, '');
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function layout(content: string) {
  return `<!doctype html><html lang="cs"><body style="margin:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#172033"><div style="padding:40px 16px"><div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden"><div style="padding:24px 28px;border-bottom:1px solid #eef0f3"><span style="font-size:22px;font-weight:800;letter-spacing:-0.5px">Garazio</span></div><div style="padding:32px 28px">${content}</div><div style="padding:20px 28px;background:#f8fafc;color:#7b8494;font-size:12px;line-height:1.5">Tento email byl odeslán automaticky ze systému Garazio.<br>Software pro malé autoservisy a pneuservisy.</div></div></div></body></html>`;
}

export function welcomeEmail(input: { name: string; garageName: string }) {
  const name = escapeHtml(input.name);
  const garageName = escapeHtml(input.garageName);
  return layout(`<h1 style="margin:0 0 12px;font-size:26px">Vítejte v Garaziu 👋</h1><p style="margin:0 0 20px;color:#596273;line-height:1.6">Ahoj ${name}, váš účet pro servis <strong>${garageName}</strong> je připravený.</p><p style="margin:0 0 24px;color:#596273;line-height:1.6">Máte <strong>30 dní zdarma</strong>. Můžete rovnou začít přidávat zakázky, zákazníky a vozidla.</p><a href="${appUrl()}/today" style="display:inline-block;background:#5b45d6;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Otevřít Garazio</a>`);
}

export function passwordResetEmail(input: { name: string; resetUrl: string }) {
  const name = escapeHtml(input.name);
  const resetUrl = escapeHtml(input.resetUrl);
  return layout(`<h1 style="margin:0 0 12px;font-size:26px">Obnovení hesla</h1><p style="margin:0 0 20px;color:#596273;line-height:1.6">Ahoj ${name}, požádali jste o obnovení hesla k účtu Garazio.</p><p style="margin:0 0 24px;color:#596273;line-height:1.6">Klikněte na tlačítko níže a nastavte si nové heslo. Odkaz je platný <strong>30 minut</strong> a lze použít pouze jednou.</p><a href="${resetUrl}" style="display:inline-block;background:#5b45d6;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Nastavit nové heslo</a><p style="margin:24px 0 0;color:#7b8494;font-size:12px;line-height:1.5">Pokud jste o změnu hesla nežádali, tento email ignorujte.</p>`);
}

export function passwordChangedEmail(input: { name: string }) {
  const name = escapeHtml(input.name);
  return layout(`<h1 style="margin:0 0 12px;font-size:26px">Heslo bylo změněno</h1><p style="margin:0;color:#596273;line-height:1.6">Ahoj ${name}, heslo k vašemu účtu Garazio bylo právě změněno.</p><p style="margin:20px 0 0;color:#7b8494;font-size:12px;line-height:1.5">Pokud jste tuto změnu neprovedli vy, kontaktujte co nejdříve podporu Garazia.</p>`);
}

export function trialEndingEmail(input: {
  garageName: string;
  trialEndsAt: Date;
  daysRemaining: number;
  appUrl: string;
}) {
  const garageName = escapeHtml(input.garageName);
  const date = input.trialEndsAt.toLocaleDateString('cs-CZ');
  const heading = input.daysRemaining === 0
    ? 'Vaše zkušební období dnes končí'
    : input.daysRemaining === 1
      ? 'Vaše zkušební období končí zítra'
      : 'Vaše zkušební období končí za 7 dní';
  const message = input.daysRemaining === 0
    ? 'Dnes končí vaše bezplatné zkušební období. Pro zachování plného přístupu aktivujte předplatné.'
    : `Zkušební období pro servis <strong>${garageName}</strong> končí ${input.daysRemaining === 1 ? 'zítra' : 'za 7 dní'} (${date}).`;

  return layout(`<h1 style="margin:0 0 12px;font-size:26px">${heading}</h1><p style="margin:0 0 20px;color:#596273;line-height:1.6">${message}</p><p style="margin:0 0 24px;color:#596273;line-height:1.6">Po skončení trialu bude účet v režimu pouze pro čtení, dokud neaktivujete předplatné.</p><a href="${escapeHtml(input.appUrl)}/predplatne" style="display:inline-block;background:#5b45d6;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Aktivovat předplatné</a>`);
}

export function subscriptionActivatedEmail(input: { garageName: string; appUrl: string }) {
  const garageName = escapeHtml(input.garageName);
  return layout(`<h1 style="margin:0 0 12px;font-size:26px">Předplatné je aktivní 🎉</h1><p style="margin:0 0 20px;color:#596273;line-height:1.6">Děkujeme. Předplatné pro servis <strong>${garageName}</strong> bylo úspěšně aktivováno.</p><p style="margin:0 0 24px;color:#596273;line-height:1.6">Váš účet má opět plný přístup ke všem funkcím Garazia.</p><a href="${escapeHtml(input.appUrl)}/today" style="display:inline-block;background:#5b45d6;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Otevřít Garazio</a>`);
}
