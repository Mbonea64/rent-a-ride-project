import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiRadio, FiShield } from "react-icons/fi";

const PresentationDashboard = ({
  eyebrow,
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  stats = [],
  steps = [],
  alerts = [],
}) => {
  return (
    <div className="dashboard-stage py-6">
      <section className="relative overflow-hidden rounded-lg bg-slate-950 p-6 text-white shadow-xl md:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-300" />
        <div className="grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div className="dashboard-reveal">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">{eyebrow}</p>
            <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">{subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {primaryAction && (
                <Link
                  to={primaryAction.to}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-sky-50"
                >
                  {primaryAction.label}
                  <FiArrowRight />
                </Link>
              )}
              {secondaryAction && (
                <Link
                  to={secondaryAction.to}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  {secondaryAction.label}
                </Link>
              )}
            </div>
          </div>

          <div className="dashboard-map rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                <FiRadio />
                Live operations
              </span>
              <span className="text-xs text-slate-400">Rent a Ride HQ</span>
            </div>
            <div className="relative h-52 overflow-hidden rounded-lg bg-slate-900">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 520 260" aria-hidden="true">
                <path
                  d="M46 190 C128 74 205 214 284 106 S394 56 474 142"
                  fill="none"
                  stroke="rgba(255,255,255,.18)"
                  strokeDasharray="10 12"
                  strokeWidth="8"
                />
                <path
                  className="dashboard-route-line"
                  d="M46 190 C128 74 205 214 284 106 S394 56 474 142"
                  fill="none"
                  pathLength="100"
                  stroke="#38bdf8"
                  strokeLinecap="round"
                  strokeWidth="8"
                />
                <circle cx="46" cy="190" r="12" fill="#22c55e" />
                <circle cx="474" cy="142" r="12" fill="#f97316" />
                <circle className="dashboard-route-dot" cx="46" cy="190" r="11" fill="#fff" />
              </svg>
              <div className="absolute bottom-4 left-4 rounded-lg bg-white/10 px-3 py-2 text-xs text-white backdrop-blur">
                Customer booking
              </div>
              <div className="absolute right-4 top-4 rounded-lg bg-white/10 px-3 py-2 text-xs text-white backdrop-blur">
                Vendor update
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <div
            className="dashboard-reveal rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            style={{ animationDelay: `${120 + index * 80}ms` }}
            key={stat.label}
          >
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{stat.value}</p>
            <p className="mt-2 text-xs text-slate-500">{stat.note}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_.85fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <FiShield className="text-sky-600" />
          <h2 className="text-lg font-semibold text-slate-950">Operating Workflow</h2>
          </div>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div className="dashboard-step flex gap-4 rounded-lg bg-slate-50 p-4" key={step.title}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-slate-950">{step.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <FiCheckCircle className="text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-950">Useful Signals</h2>
          </div>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div className="rounded-lg bg-slate-50 p-4" key={alert.title}>
                <p className="font-semibold text-slate-950">{alert.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{alert.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

PresentationDashboard.propTypes = {
  eyebrow: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  primaryAction: PropTypes.shape({ label: PropTypes.string, to: PropTypes.string }),
  secondaryAction: PropTypes.shape({ label: PropTypes.string, to: PropTypes.string }),
  stats: PropTypes.array,
  steps: PropTypes.array,
  alerts: PropTypes.array,
};

export default PresentationDashboard;
