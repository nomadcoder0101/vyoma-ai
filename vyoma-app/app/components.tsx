import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { navItems } from "../lib/content";

export function Topbar() {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="Vyoma AI home">
        <span className="brandMark">V</span>
        <span className="brandText">
          <strong>Vyoma AI</strong>
          <span>Career operations dashboard</span>
        </span>
      </Link>
      <nav className="nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
        <Show when="signed-out">
          <SignInButton mode="modal"><button className="button secondary" type="button">Sign in</button></SignInButton>
          <SignUpButton mode="modal"><button className="button primary" type="button">Sign up</button></SignUpButton>
        </Show>
        <Show when="signed-in">
          <Link className="button primary" href="/dashboard">
            Open App <ArrowRight size={16} />
          </Link>
          <UserButton />
        </Show>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      Vyoma AI is in pilot mode. Responsible AI-assisted career operations,
      with the human in control.
    </footer>
  );
}

export function MetricCard({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className="metric">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

export function SectionTitle({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="sectionTitle">
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

export function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="card">
      <span className="cardIcon">{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

export function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
  }).format(date);
}
