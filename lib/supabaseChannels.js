import { supabase } from './supabase';

// Channel name generators
export const channels = {
  notifications: (userId) => `notifications:${userId}`,
  messages: (conversationId) => `messages:${conversationId}`,
  typing: (conversationId) => `typing:${conversationId}`,
  calls: (userId) => `calls:${userId}`,
  presence: () => 'presence:global',
  feed: () => 'feed:updates',
};

// Subscribe to a channel
export function subscribeToChannel(channelName, eventType, callback) {
  if (!supabase) {
    console.warn('[Supabase] Not initialized, skipping subscription to', channelName);
    return null;
  }
  
  const channel = supabase.channel(channelName)
    .on('broadcast', { event: eventType }, (payload) => {
      callback(payload.payload);
    })
    .subscribe();
  
  return channel;
}

// Broadcast to a channel
export async function broadcastToChannel(channelName, eventType, payload) {
  if (!supabase) return;
  
  const channel = supabase.channel(channelName);
  await channel.send({
    type: 'broadcast',
    event: eventType,
    payload,
  });
}

// Subscribe to multiple events on one channel
export function subscribeToMultipleEvents(channelName, events) {
  if (!supabase) return null;
  
  let channel = supabase.channel(channelName);
  
  for (const { event, callback } of events) {
    channel = channel.on('broadcast', { event }, (payload) => {
      callback(payload.payload);
    });
  }
  
  channel.subscribe();
  return channel;
}

// Unsubscribe from a channel
export function unsubscribeFromChannel(channel) {
  if (!supabase || !channel) return;
  supabase.removeChannel(channel);
}

// Presence helpers
export function trackPresence(channelName, userState) {
  if (!supabase) return null;
  
  const channel = supabase.channel(channelName)
    .on('presence', { event: 'sync' }, () => {})
    .on('presence', { event: 'join' }, ({ newPresences }) => {})
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {})
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track(userState);
      }
    });
  
  return channel;
}

// Notification broadcast helper
export async function sendNotification(userId, notification) {
  await broadcastToChannel(
    channels.notifications(userId),
    'new_notification',
    notification
  );
}

// Call signal helpers
export async function sendCallSignal(userId, signal) {
  await broadcastToChannel(
    channels.calls(userId),
    signal.type, // 'incoming', 'accepted', 'rejected', 'cancelled', 'ended'
    signal
  );
}

// Typing indicator helpers
export async function sendTypingIndicator(conversationId, userId, isTyping) {
  await broadcastToChannel(
    channels.typing(conversationId),
    'typing',
    { userId, isTyping, timestamp: Date.now() }
  );
}

// Message broadcast helper
export async function broadcastMessage(conversationId, message) {
  await broadcastToChannel(
    channels.messages(conversationId),
    'new_message',
    message
  );
}
