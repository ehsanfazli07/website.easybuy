import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

import SellerStorefront from "@/app/components/seller-storefront";
import { authOptions } from "@/lib/auth";
import { getSellerStorefront } from "@/lib/seller-storefront";

export default async function UserProfilePage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const session = await getServerSession(authOptions);

  const storefront = await getSellerStorefront({
    sellerId: id,
    viewerId: session?.user?.id,
  });

  if (!storefront) {
    notFound();
  }

  return <SellerStorefront sellerId={id} loggedIn={Boolean(session?.user?.id)} isOwner={session?.user?.id === id} initialData={storefront} />;
}
