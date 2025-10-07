declare module "preact-router" {
  import { ComponentType } from "preact";

  export interface RouterProps {
    onChange?: (event: { url: string }) => void;
    children?: preact.ComponentChildren;
  }

  export interface RouteProps<Props = {}> {
    path?: string;
    component?: ComponentType<Props>;
    default?: boolean;
  }

  export default class Router extends preact.Component<RouterProps> {}
  export function Route<Props = {}>(
    props: RouteProps<Props> & Props
  ): preact.VNode | null;
  export function route(url: string, replace?: boolean): boolean;
  export function getCurrentUrl(): string;
  export function Link(props: any): preact.VNode;
}

declare module "preact-router/match" {
  export function Link(props: {
    activeClassName?: string;
    path: string;
    children: preact.ComponentChildren;
    className?: string;
  }): preact.VNode;

  export function Match(props: {
    path?: string;
    children: (props: {
      matches: boolean;
      path: string;
      url: string;
    }) => preact.ComponentChildren;
  }): preact.VNode | null;
}
