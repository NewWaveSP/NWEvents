import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IEventsWithLocationProps {
  description: string;
  siteUrl : string;
  context: WebPartContext;
}
