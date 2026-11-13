export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12" aria-labelledby="title">
        <p className="text-sm font-bold tracking-widest text-slate-500">CEFIN</p>
        <h1 id="title" className="mt-3 text-4xl font-bold tracking-tight">Data Hub</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
          Estamos preparando la plataforma de registro a clases y gestión de contactos.
        </p>
        <p className="mt-8 border-t border-slate-100 pt-6 text-sm text-slate-500">
          La captación de registros todavía no está habilitada.
        </p>
      </section>
    </main>
  );
}
