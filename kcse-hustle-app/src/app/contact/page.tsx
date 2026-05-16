export default function ContactPage() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-8 space-y-3">
      <h1 className="text-3xl font-bold">Contact</h1>
      <p className="text-slate-700">For account activation and support:</p>
      <ul className="text-slate-600">
        <li>Email: t3chhub404@gmail.com</li>
        <li>
          Telegram:{" "}
          <a
            className="text-[var(--portal-green)] underline"
            href="https://t.me/techhub_ke"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://t.me/techhub_ke
          </a>
        </li>
      </ul>
    </section>
  );
}
