// Base UI's direction provider, under the name shadcn/ui gives it. Base UI's
// components read the reading direction from it, for the side a popup opens
// on and the arrow keys' order, so it is given the direction of the
// language the dashboard is shown in.
export { DirectionProvider, useDirection } from '@base-ui/react/direction-provider';
