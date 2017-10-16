export default interface IChatResponse {
    /** The text that will be displayed to the end client. */
    speech?: string;

    /** In order to define an context out. */
    contextOut?: IContextOut[];

    /** In order to trigger a specific action right after this intent is handled. */
    followupEvent?: IFollowupEvent;
}

export interface IContextOut {
    name: string;
    lifespan?: number;
    parameters?: object;
}

export interface IFollowupEvent {
    name: string;
    data?: object;
}
