import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  BaseClientSideWebPart,
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-webpart-base';

import * as strings from 'EventsWithLocationWebPartStrings';
import EventsWithLocation from './components/EventsWithLocation';
import { IEventsWithLocationProps } from './components/IEventsWithLocationProps';

export default class EventsWithLocationWebPart extends BaseClientSideWebPart<IEventsWithLocationProps> {

  public render(): void {
    const element: React.ReactElement<IEventsWithLocationProps > = React.createElement(
      EventsWithLocation,
      {
        description: this.properties.description,
        siteUrl : this.context.pageContext.web.absoluteUrl,
        context : this.context
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
