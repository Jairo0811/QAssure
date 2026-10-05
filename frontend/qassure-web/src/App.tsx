const metrics = [
  ['92%', 'Pass rate'],
  ['84%', 'Coverage'],
  ['12', 'Open defects'],
  ['4', 'Active test runs'],
]

function App() {
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brandMark">Q✓</span>
          <div>
            <strong>QAssure</strong>
            <small>Verify. Validate. Assure.</small>
          </div>
        </div>
        <span className="badge">ISO-410 · Foundation</span>
      </header>

      <section className="hero">
        <div className="heroCopy">
          <p className="eyebrow">SOFTWARE QUALITY ASSURANCE PLATFORM</p>
          <h1>Quality evidence you can trace.</h1>
          <p className="lede">
            Connect requirements, test cases, executions and defects in one measurable QA workflow.
          </p>
          <div className="actions">
            <button className="primary">Create QA Project</button>
            <button className="secondary">View Test Runs</button>
          </div>
        </div>

        <div className="qualityPanel">
          <div className="panelHeader">
            <span>Quality overview</span>
            <span className="live">● LIVE</span>
          </div>
          <div className="metrics">
            {metrics.map(([value, label]) => (
              <article className="metric" key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </article>
            ))}
          </div>
          <div className="pipeline">
            {['Requirements', 'Test Cases', 'Execution', 'Defects', 'Release'].map((step, index) => (
              <div className="pipelineStep" key={step}>
                <span className={step === 'Defects' ? 'node defect' : 'node'}>{step === 'Defects' ? '!' : '✓'}</span>
                <small>{step}</small>
                {index < 4 && <i />}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
