"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Alert, BrandMark } from "@/components/ui";
import { api } from "@/lib/client-api";
import { formatNaira } from "@/catalogue/money";
import { AppearanceControl } from "@/components/theme";
import { ImageRotator } from "@/components/image-rotator";
import { FASHION_MEDIA } from "@/site/media";
import type { PublicUser } from "./sections";

type User = PublicUser;
type Order = { id: string; total: number; status: string; items: { name: string; quantity: number }[]; createdAt?: string };
type Notification = { id: string; title: string; body: string; read: boolean; createdAt?: string };
type Me = { user: User; currentShop: { slug: string; name: string } | null };

const navigation = [
  ["⌂", "Dashboard", "/account"],
  ["⌕", "Explore Shops", "/shops"],
  ["▣", "My Orders", "/account/orders"],
  ["✂", "Custom Orders", "/contact"],
  ["◇", "Measurements", "/account"],
  ["♡", "Wishlist", "/account#wishlist"],
  ["▤", "Messages", "/contact"],
  ["♧", "Notifications", "/account#notifications"],
  ["●", "Profile", "/account/profile"],
  ["⚙", "Settings", "/account"],
  ["?", "Help & Support", "/contact"],
];

export default function AccountPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<Me>("/api/v1/auth/me"),
      api<{ orders: Order[] }>("/api/v1/account/orders"),
      api<{ notifications: Notification[] }>("/api/v1/account/notifications?limit=5"),
    ]).then(([meResult, ordersResult, notificationsResult]) => {
      if (!meResult.ok) {
        if (meResult.error.code === "UNAUTHENTICATED") window.location.assign("/login?next=/account");
        else setError(meResult.error.message);
        return;
      }
      setMe(meResult.data);
      if (ordersResult.ok) setOrders(ordersResult.data.orders);
      if (notificationsResult.ok) setNotifications(notificationsResult.data.notifications);
    }).catch(() => setError("We could not load your dashboard. Please try again."));
  }, []);

  const firstName = me?.user.fullName.split(" ")[0] ?? "there";
  const latestOrder = orders[0];
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const totalSpent = useMemo(() => orders.reduce((sum, order) => sum + order.total, 0), [orders]);

  if (error) return <main className="mx-auto max-w-md px-4 py-16"><Alert kind="error">{error}</Alert></main>;
  if (!me) return <main className="min-h-screen bg-slate-50 px-4 py-16 text-center text-sm text-slate-600">Loading your dashboard</main>;

  return (
    <div className="dashboard-shell min-h-screen text-slate-800">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 bg-gradient-to-b from-[#06275b] to-[#0b438d] px-4 py-6 text-white lg:flex lg:flex-col">
          <Link href="/" className="mb-9 flex items-center gap-3 px-3">
            <span className="text-4xl font-semibold text-cyan">T</span>
            <span><strong className="block text-2xl">Tailorly</strong><small className="block text-[10px] text-blue-100">Your Tailoring Business,<br />Digitally Connected.</small></span>
          </Link>
          <nav aria-label="Account" className="grid gap-1">
            {navigation.map(([icon, label, href]) => <Link key={label} href={href} className={`dashboard-nav-link flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition hover:bg-white/15 ${label === "Dashboard" ? "dashboard-nav-active font-semibold text-white shadow-lg" : "text-blue-50"}`}><span className="w-5 text-center text-lg">{icon}</span>{label}{label === "Notifications" && unreadCount > 0 ? <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px]">{unreadCount}</span> : null}</Link>)}
          </nav>
          <div className="mt-auto rounded-2xl border border-cyan/70 bg-navy/40 p-5 text-center"><p className="text-2xl">♛</p><p className="mt-2 font-semibold">Upgrade to Premium</p><p className="mt-1 text-xs text-blue-100">Enjoy more benefits!</p><Link href="/get-started" className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-navy">Learn More →</Link></div>
          <button type="button" className="logout-button mt-6 flex w-full items-center gap-2 rounded-xl border-t border-white/15 px-3 pt-5 text-left text-sm text-blue-100" onClick={() => { void api("/api/v1/auth/logout", { method: "POST", body: {} }).then(() => window.location.assign("/login")); }}><span className="text-lg">↪</span> Sign out</button>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="dashboard-header border-t-4 border-cyan border-b border-white/70 bg-white/75 px-4 py-4 shadow-sm backdrop-blur sm:px-8">
            <div className="mx-auto flex max-w-7xl items-center gap-4">
              <BrandMark className="lg:hidden" />
              <details className="account-mobile-nav relative lg:hidden">
                <summary aria-label="Open dashboard navigation" className="inline-flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border-2 border-navy bg-white text-navy shadow-sm [&::-webkit-details-marker]:hidden">
                  <span className="sr-only">Open dashboard navigation</span><span aria-hidden="true" className="text-xl leading-none">☰</span>
                </summary>
                <div className="account-mobile-nav-menu absolute left-0 top-full z-50 mt-2 w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-2 text-sm shadow-xl">
                  {navigation.map(([icon, label, href]) => <Link key={label} href={href} className={`dashboard-mobile-nav-link flex items-center gap-3 rounded-xl px-4 py-3 font-medium text-slate-700 hover:text-navy ${label === "Dashboard" ? "dashboard-mobile-nav-active" : ""}`}><span className="w-5 text-center text-lg text-cyan-dark">{icon}</span>{label}{label === "Notifications" && unreadCount > 0 ? <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white">{unreadCount}</span> : null}</Link>)}
                </div>
              </details>
              <label className="hidden max-w-xl flex-1 items-center gap-3 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-400 sm:flex"><span className="text-lg">⌕</span><input aria-label="Search" placeholder="Search shops, products, or designs..." className="w-full bg-transparent outline-none" /></label>
              <div className="ml-auto flex items-center gap-3"><AppearanceControl compact /><Link href="/account#notifications" aria-label="Notifications" className="relative text-xl text-navy">♧{unreadCount > 0 ? <span className="absolute -right-2 -top-2 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{unreadCount}</span> : null}</Link><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-navy">{me.user.fullName}</p><p className="text-xs text-cyan">Customer</p></div>{me.user.profileImage ? <img src={me.user.profileImage.url} alt={`${me.user.fullName} profile`} className="h-10 w-10 rounded-full object-cover" /> : <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan/20 font-bold text-navy">{firstName[0]}</span>}</div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8">
            {!me.user.emailVerified ? <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950"><div><p className="font-semibold">Your email is not verified yet</p><p className="mt-1 text-sm text-amber-900/80">Verify your email to unlock sensitive account actions. You can still browse and manage your basic profile.</p></div><Link href="/account/profile" className="rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white">Verify email</Link></section> : null}
            <section className="dashboard-hero animate-rise-in rounded-[1.5rem] px-6 py-7 shadow-xl shadow-navy/10 sm:px-10"><ImageRotator images={FASHION_MEDIA.customerDashboard} label="Customer dashboard fashion highlights" className="dashboard-hero-image" imageClassName="h-full w-full object-cover opacity-70 mix-blend-multiply" /><div className="relative z-10 max-w-2xl"><div className="flex items-center gap-4"><div className="shrink-0">{me.user.profileImage ? <img src={me.user.profileImage.url} alt={`${me.user.fullName} profile`} className="h-16 w-16 rounded-full object-cover ring-4 ring-white/70" /> : <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-2xl font-bold text-navy">{firstName[0]?.toUpperCase()}</span>}</div><div><p className="text-2xl font-semibold text-navy sm:text-3xl">Welcome back, {firstName}! 👋</p><p className="mt-2 max-w-xl text-sm text-navy/80 sm:text-base">Discover Nigerian designers, native styles and your next dream outfit.</p></div></div><div className="mt-5 flex flex-wrap gap-3"><Link href="/shops" className="rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-navy-dark">Explore Nigerian Shops →</Link><Link href="/contact" className="rounded-full border border-navy/60 bg-white/25 px-5 py-3 text-sm font-semibold text-navy transition hover:-translate-y-0.5 hover:bg-white/50">Create Custom Order</Link></div></div></section>

            <section className="animate-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric icon="▣" label="Total Orders" value={orders.length} note={orders.length ? formatNaira(totalSpent) : "No orders yet"} />
              <Metric icon="♡" label="Favourite Shops" value="—" note="Save shops you love" />
              <Metric icon="🛒" label="Cart Items" value="—" note="View your cart" href="/cart" />
              <Metric icon="★" label="Your Rating" value="—" note="Leave a review after an order" />
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
              <section className="dashboard-card rounded-2xl border p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-navy">Track Your Latest Order</h2><Link href="/account/orders" className="text-sm font-semibold text-cyan-dark">View All Orders →</Link></div>{latestOrder ? <><div className="mt-6 flex items-center justify-between gap-2 text-xs font-medium text-navy"><ProgressStep label="Ordered" active /><ProgressStep label="Making" active={latestOrder.status === "paid" || latestOrder.status === "processing"} /><ProgressStep label="Ready" active={latestOrder.status === "ready" || latestOrder.status === "completed"} /><ProgressStep label="Delivered" active={latestOrder.status === "delivered"} /></div><div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-3"><div><p className="font-semibold text-navy">{latestOrder.items[0]?.name ?? "Your order"}</p><p className="text-sm text-slate-500">{formatNaira(latestOrder.total)}</p></div><span className="rounded-full bg-cyan/10 px-3 py-1 text-xs font-semibold capitalize text-cyan-dark">{latestOrder.status.replaceAll("_", " ")}</span><Link href="/account/orders" className="rounded-full border border-cyan px-4 py-2 text-sm font-semibold text-navy">View Details →</Link></div></> : <EmptyState title="No orders yet" text="Explore shops to discover your next outfit." href="/shops" label="Explore Shops" />}</section>
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-navy">Quick Actions</h2></div><div className="mt-5 grid grid-cols-2 gap-3"><Action href="/shops" icon="▣" label="Browse Shops" /><Action href="/account/orders" icon="⌕" label="Track Order" /><Action href="/account" icon="◇" label="View Measurements" /><Action href="/contact" icon="?" label="Contact Support" /></div></section>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-navy">Recent Orders</h2><Link href="/account/orders" className="text-sm font-semibold text-cyan-dark">View all →</Link></div>{orders.length ? <div className="mt-4 divide-y divide-slate-100">{orders.slice(0, 4).map((order) => <div key={order.id} className="flex items-center justify-between gap-3 py-3 text-sm"><div><p className="font-medium text-navy">{order.items[0]?.name ?? "Order"}</p><p className="text-xs text-slate-500">{formatNaira(order.total)}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize text-slate-600">{order.status.replaceAll("_", " ")}</span></div>)}</div> : <EmptyState title="Your order history is empty" text="Orders you place will appear here." href="/shops" label="Explore Shops" />}</section>
              <section id="notifications" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-navy">Recent Activity</h2><Link href="/account#notifications" className="text-sm font-semibold text-cyan-dark">View all →</Link></div>{notifications.length ? <div className="mt-4 divide-y divide-slate-100">{notifications.map((notification) => <div key={notification.id} className="py-3"><p className="text-sm font-medium text-navy">{notification.title}</p><p className="mt-1 text-xs text-slate-500">{notification.body}</p></div>)}</div> : <EmptyState title="No recent activity" text="Updates from your shops will appear here." href="/shops" label="Explore Shops" />}</section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, note, href }: { icon: string; label: string; value: string | number; note: string; href?: string }) {
  const content = <div className="dashboard-card dashboard-metric rounded-2xl border p-5"><div className="flex items-center gap-3"><span className="dashboard-icon inline-flex h-11 w-11 items-center justify-center rounded-full bg-cyan/15 text-xl text-navy">{icon}</span><div><p className="text-xs text-slate-500">{label}</p><p className="text-2xl font-bold text-navy">{value}</p></div></div><p className="mt-4 text-xs text-slate-500">{note}</p></div>;
  return href ? <Link href={href} className="block">{content}</Link> : content;
}

function ProgressStep({ label, active }: { label: string; active: boolean }) {
  return <div className="flex flex-1 flex-col items-center gap-2 text-center"><span className={`h-5 w-5 rounded-full ${active ? "bg-cyan text-white" : "bg-slate-200 text-slate-400"}`}>✓</span><span>{label}</span></div>;
}

function Action({ href, icon, label }: { href: string; icon: string; label: string }) {
  return <Link href={href} className="rounded-xl border border-slate-200 p-4 text-center text-sm font-semibold text-navy transition hover:border-cyan hover:bg-cyan/5"><span className="block text-xl text-cyan-dark">{icon}</span><span className="mt-2 block">{label}</span></Link>;
}

function EmptyState({ title, text, href, label }: { title: string; text: string; href: string; label: string }) {
  return <div className="py-8 text-center"><p className="font-medium text-navy">{title}</p><p className="mt-1 text-sm text-slate-500">{text}</p><Link href={href} className="mt-4 inline-flex rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white">{label} →</Link></div>;
}
