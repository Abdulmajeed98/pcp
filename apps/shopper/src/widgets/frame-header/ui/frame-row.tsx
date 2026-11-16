import { NameSlot } from './name-slot';
import { Switches } from './switches';
import { WayToTheBuild } from './way-to-the-build';

// What the frame's header holds, on the stub and on the home page's card:
// the name slot on the start side and the switches on the end side, and the
// way to the Build (builder ticket 06). From 48rem the way to the Build
// stands first on the switches' side, before Prices in. Below 48rem it
// stands at the end of the name slot's row where the row is at least 21em
// wide, as at 390 pixels, and under the name where it is narrower, as at 360
// pixels or with a phone's text made larger. The row's width in its own
// text's em decides it, not how wide the words are drawn, so that the page's
// fonts arriving after its first frame, wider or narrower than the device's
// own, never move the page (builder ticket 07). Each width shows one of the
// two places, and the other is not drawn, so a reader and the keyboard meet
// it once.
export function FrameRow({
  onTheHomePage = false,
  onTheBuildPage = false,
}: {
  onTheHomePage?: boolean;
  onTheBuildPage?: boolean;
}) {
  return (
    <>
      <div className="w-full max-md:@container/name-row md:w-auto">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center justify-items-start gap-x-4 @min-[21em]/name-row:grid-cols-[minmax(0,1fr)_auto] md:flex">
          <NameSlot onTheHomePage={onTheHomePage} />
          <span className="flex @min-[21em]/name-row:justify-self-end md:hidden">
            <WayToTheBuild onTheBuildPage={onTheBuildPage} />
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-6">
        <span className="hidden md:flex">
          <WayToTheBuild onTheBuildPage={onTheBuildPage} />
        </span>
        <Switches />
      </div>
    </>
  );
}
