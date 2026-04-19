import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import MessageReplyForm from "@/app/components/message-reply-form";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type MessagesPageProps = {
  searchParams?: Promise<{ with?: string }>;
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = searchParams ? await searchParams : undefined;
  const activeCounterpartId = params?.with || "";

  if (activeCounterpartId) {
    await prisma.sellerMessage.updateMany({
      where: {
        senderId: activeCounterpartId,
        recipientId: session.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  const messages = await prisma.sellerMessage.findMany({
    where: {
      OR: [{ senderId: session.user.id }, { recipientId: session.user.id }],
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      recipient: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          username: true,
          sellerProfile: {
            select: {
              storeName: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const threads = new Map<string, (typeof messages)[number]>();

  for (const message of messages) {
    const counterpartId = message.senderId === session.user.id ? message.recipientId : message.senderId;
    const key = `${message.sellerId}:${counterpartId}`;

    if (!threads.has(key)) {
      threads.set(key, message);
    }
  }

  const threadList = Array.from(threads.values());
  const activeThread = threadList.find((message) => {
    const counterpartId = message.senderId === session.user.id ? message.recipientId : message.senderId;
    return counterpartId === activeCounterpartId;
  }) || threadList[0];

  const activeConversation = activeThread
    ? [...messages]
        .filter((message) => {
          const counterpartId = message.senderId === session.user.id ? message.recipientId : message.senderId;
          return message.sellerId === activeThread.sellerId && counterpartId === (activeThread.senderId === session.user.id ? activeThread.recipientId : activeThread.senderId);
        })
        .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
    : [];

  return (
    <main className="page-wrap seller-messages-page">
      <section className="panel seller-messages-shell">
        <div className="seller-messages-sidebar">
          <div className="seller-messages-sidebar-head">
            <h1>Messages</h1>
            <p className="muted">Open any conversation with buyers or sellers.</p>
          </div>
          <div className="seller-thread-list">
            {threadList.length === 0 ? (
              <p className="muted">No messages yet.</p>
            ) : (
              threadList.map((thread) => {
                const counterpart = thread.senderId === session.user.id ? thread.recipient : thread.sender;
                const counterpartId = counterpart.id;
                const isActive = activeThread ? (activeThread.senderId === session.user.id ? activeThread.recipientId : activeThread.senderId) === counterpartId && activeThread.sellerId === thread.sellerId : false;

                return (
                  <Link
                    key={thread.id}
                    href={`/messages?with=${counterpartId}`}
                    className={`seller-thread-card${isActive ? " seller-thread-card--active" : ""}`}
                  >
                    <strong>{thread.seller.sellerProfile?.storeName || thread.seller.username || thread.seller.name || "Seller"}</strong>
                    <span>{counterpart.username || counterpart.name || "User"}</span>
                    <span className="muted">{thread.message}</span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="seller-messages-main">
          {activeThread ? (
            <>
              <div className="seller-messages-main-head">
                <h2>{activeThread.seller.sellerProfile?.storeName || activeThread.seller.username || activeThread.seller.name || "Conversation"}</h2>
                <p className="muted">
                  With {activeThread.senderId === session.user.id ? activeThread.recipient.username || activeThread.recipient.name || "User" : activeThread.sender.username || activeThread.sender.name || "User"}
                </p>
              </div>
              <div className="seller-conversation-stream">
                {activeConversation.map((message) => {
                  const mine = message.senderId === session.user.id;

                  return (
                    <article key={message.id} className={`seller-bubble${mine ? " seller-bubble--mine" : ""}`}>
                      <p>{message.message}</p>
                      <span className="muted">{message.createdAt.toLocaleString()}</span>
                    </article>
                  );
                })}
              </div>
              <MessageReplyForm
                recipientId={activeThread.senderId === session.user.id ? activeThread.recipientId : activeThread.senderId}
                sellerId={activeThread.sellerId}
              />
            </>
          ) : (
            <div className="seller-empty-state">
              <h2>Select a conversation</h2>
              <p>Start from any seller profile by pressing Message.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}