import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { DeviceContextService } from './device-context.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushService {
  private swPush = inject(SwPush);
  private supabase = inject(SupabaseService);
  private device = inject(DeviceContextService);

  /** Subscribe to push and save subscription to DB */
  async subscribe(): Promise<boolean> {
    if (!this.swPush.isEnabled) return false;

    try {
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: environment.vapidPublicKey,
      });
      await this.saveSubscription(subscription);
      this.device.notificationPermission.set('granted');
      return true;
    } catch {
      this.device.notificationPermission.set(
        'Notification' in window ? Notification.permission : 'denied'
      );
      return false;
    }
  }

  /** Unsubscribe from push and remove subscription from DB */
  async unsubscribe(): Promise<void> {
    if (!this.swPush.isEnabled) return;

    const sub = await firstValueFrom(this.swPush.subscription);
    if (sub) {
      await this.removeSubscription(sub.endpoint);
    }
    await this.swPush.unsubscribe();
  }

  /** Initialize listeners for subscription changes and notification clicks */
  init(): void {
    if (!this.swPush.isEnabled) return;

    // Re-sync subscription if browser rotates keys
    this.swPush.subscription.subscribe(sub => {
      if (sub) {
        this.saveSubscription(sub);
      }
    });

    // Handle notification clicks (ngsw handles navigation via onActionClick,
    // but we can react in-app if needed)
    this.swPush.notificationClicks.subscribe(({ action }) => {
      // ngsw already handles focusLastFocusedOrOpen / navigateLastFocusedOrOpen
      // via the payload's onActionClick. Nothing extra needed for now.
      console.log('[PushService] notification click:', action || 'default');
    });
  }

  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    const json = subscription.toJSON();
    const keys = json.keys as Record<string, string> | undefined;
    if (!json.endpoint || !keys?.['p256dh'] || !keys?.['auth']) return;

    const { data: { user } } = await this.supabase.supabase.auth.getUser();
    if (!user) return;

    await this.supabase.supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint: json.endpoint,
          p256dh: keys['p256dh'],
          auth: keys['auth'],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,endpoint' }
      );
  }

  private async removeSubscription(endpoint: string): Promise<void> {
    const { data: { user } } = await this.supabase.supabase.auth.getUser();
    if (!user) return;

    await this.supabase.supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);
  }
}
