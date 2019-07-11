import { ISubscription } from '../../subscribers/subscriber.type';
import { IncomingWebhookSendArguments } from '@slack/webhook';
import { IMessageCard } from '../../@typings/message-card';

export interface INotification {
  notify(subscriptions: ISubscription[]): Promise<void>;
}

export interface IDefaultNotification {
  title: string;
  facts: Array<{ name: string; value: string }>;
  image?: string;
}

export abstract class Notification implements INotification {
  /**
   * A type guard that can be used to add typing to a CloudEvent. It's working
   * under the assumption that if the event name passes, the rest of the event
   * is valid.
   * @param eventName - The name of the event.
   * @param event - The event itself.
   */
  public static isEvent<T extends { type: string }>(
    eventName: string,
    event: { type: string },
  ): event is T {
    return (event as T).type === eventName;
  }

  protected defaultNotification: IDefaultNotification;
  protected slackNotification?: IncomingWebhookSendArguments;
  protected teamsNotification?: IMessageCard;

  /**
   * Sends notifications all the subscribers.
   *
   * @param subscriptions - An array of subscribers to the notification
   */
  public async notify(subscriptions: ISubscription[]): Promise<void> {
    subscriptions.forEach(s => s.send(this));
  }

  /**
   * Generates a Slack webhook payload
   */
  public getSlackNotification(): IncomingWebhookSendArguments {
    if (!this.slackNotification) {
      if (!this.defaultNotification) {
        // TODO
        throw new Error('MISSING');
      }

      const message: IncomingWebhookSendArguments = {
        text: this.defaultNotification.title,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: this.defaultNotification.title,
            },
          },
          {
            type: 'section',
            fields: this.defaultNotification.facts.map(f => ({
              type: 'mrkdwn',
              text: `*${f.name}*:\n${f.value}`,
            })),
            // TODO improve
            accessory: this.defaultNotification.image
              ? {
                  type: 'image',
                  image_url: this.defaultNotification.image,
                  alt_text: 'Keptn',
                }
              : undefined,
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'View Keptn Context',
                },
                // TODO generate Keptn context URL
                url: 'https://dynatrace.com',
              },
            ],
          },
        ],
      };
      return message;
    }
    return this.slackNotification;
  }

  /**
   * Generates a Teams webhook payload.
   */
  public getTeamsNotification(): IMessageCard {
    if (!this.teamsNotification) {
      if (!this.defaultNotification) {
        // TODO
        throw new Error('MISSING');
      }

      const message: IMessageCard = {
        '@type': 'MessageCard',
        '@context': 'https://schema.org/extensions',
        'summary': this.defaultNotification.title,
        'title': this.defaultNotification.title,
        'sections': [
          {
            facts: this.defaultNotification.facts.map(f => ({name: `${f.name}:`, value: f.value })),
          },
        ],
        'potentialAction': [
          {
            '@type': 'OpenUri',
            'name': 'View Keptn Context',
            'targets': [
              {
                os: 'default',
                // TODO change
                uri: 'https://dynatrace.com',
              },
            ],
          },
        ],
      };
      return message;
    }
    return this.teamsNotification;
  }
}
