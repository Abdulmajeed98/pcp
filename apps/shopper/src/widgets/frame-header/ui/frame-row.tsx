import { NameSlot } from './name-slot';
import { Switches } from './switches';
import { WayToTheBuild } from './way-to-the-build';

// What the frame's header holds, on the stub and on the home page's card:
// the name slot on the start side and the switches on the end side, and the
// way to the Build (builder ticket 06): below 48rem it stands at the end of
// the name slot's row, which wraps when the two do not fit, the way to the
// Build under the name; from 48rem it stands first on the switches' side,
// before Prices in. Each width shows one of its two places, and the other is
// not drawn, so a reader and the keyboard meet it once.
export function FrameRow({
  onTheHomePage = false,
  onTheBuildPage = false,
}: {
  onTheHomePage?: boolean;
  onTheBuildPage?: boolean;
}) {
  return (
    <>
      <div className="flex w-full flex-wrap items-center justify-between gap-x-4 md:w-auto md:justify-start">
        <NameSlot onTheHomePage={onTheHomePage} />
        <span className="flex md:hidden">
          <WayToTheBuild onTheBuildPage={onTheBuildPage} />
        </span>
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
