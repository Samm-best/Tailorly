import { ShopShell } from "@/components/site";
import { requireShopPage } from "@/lib/page-context";
import CartContent from "./cart-content";

export default async function CartPage() {
  const shop = await requireShopPage();
  return <ShopShell shop={shop}><CartContent /></ShopShell>;
}
