export default function Home() {
  return (
    <main className="av-main">
      <section className="av-hero">
        <h1 className="flicker">Arcade Vault</h1>
        <p className="sub">
          Juega y compite por el récord <span className="blink">_</span>
        </p>
        <div style={{ marginTop: 32 }}>
          <button className="btn lg pulse" type="button">
            Insertar moneda
          </button>
        </div>
      </section>
    </main>
  );
}
