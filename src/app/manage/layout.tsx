import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage shop",
  robots: { index: false },
};

export default function ManageLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
