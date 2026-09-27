"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapContainer, TileLayer, Circle, Tooltip, useMap } from "react-leaflet";
import { latLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MappedProperty {
  id: string;
  name: string;
  slug: string;
  price: string;
  category: string;
  latitude: number;
  longitude: number;
}

/**
 * Roughly a kilometre. These are private homes we represent rather than own,
 * so the map shows the area a property is in, not the property. No pin, no
 * marker: a circle cannot be mistaken for an address, which a pin can.
 */
const APPROX_RADIUS_METRES = 900;

/**
 * The closest the map will ever go, and the zoom used when there is nothing to
 * fit to. Chosen from the radius rather than picked by eye: at latitude 36 a
 * 900m circle is 29px across at zoom 11 and 233px at zoom 14, so anything
 * below 13 shows the "approximate area" as a dot, which defeats the point of
 * drawing a circle instead of a pin.
 *
 *   zoom 11 ->  29px    zoom 13 -> 116px
 *   zoom 12 ->  58px    zoom 14 -> 233px
 *
 * 13 reads clearly as a circle while keeping the surrounding neighbourhood in
 * view. It is also the cap on fitBounds, so several properties in one town
 * cannot zoom past it either.
 */
const CIRCLE_READABLE_ZOOM = 13;

const POINTER_QUERY = "(pointer: fine)";

/**
 * Fits the view to whatever is being shown, so one distant property does not
 * leave the rest in a huddle.
 *
 * invalidateSize() first, and this is not optional. The map mounts into a
 * container that has only just swapped from the placeholder, and Leaflet
 * caches the container size at construction. Without it Leaflet measures a
 * container it thinks is tiny, and fitBounds resolves to the maximum zoom:
 * the first version of this put a nine-property national map at street level
 * over an empty patch of sea.
 *
 * maxZoom on the fit stops a single property, or several in one town, from
 * zooming in far enough to identify a building, which would undo the point of
 * drawing approximate circles in the first place.
 */
function FitToProperties({ items }: { items: MappedProperty[] }) {
  const map = useMap();

  useEffect(() => {
    if (items.length === 0) return;

    // Deferred to the next frame, and this is the fix for a real bug rather
    // than caution. React runs a child's effects BEFORE its parent's, so this
    // effect fires before MapContainer has finished setting the map up and
    // laying the container out. Fitting at that moment measured a container
    // Leaflet thought was tiny and resolved to maximum zoom: a nine-property
    // national map arrived at street level over an empty patch of sea.
    const frame = requestAnimationFrame(() => {
      map.invalidateSize();

      // One property: there are no bounds to fit. Fitting a single point is
      // degenerate and Leaflet resolves it to the maximum zoom or to nothing
      // useful, which is how a one-property map ended up showing North Africa.
      if (items.length === 1) {
        map.setView([items[0].latitude, items[0].longitude], CIRCLE_READABLE_ZOOM);
        return;
      }

      // Corners computed explicitly rather than handing Leaflet an array and
      // trusting the overload: the two-corner form is unambiguous, and
      // getting this wrong is silent, it just shows the wrong place.
      const lats = items.map((p) => p.latitude);
      const lngs = items.map((p) => p.longitude);
      const south = Math.min(...lats);
      const north = Math.max(...lats);
      const west = Math.min(...lngs);
      const east = Math.max(...lngs);

      // Identical coordinates give zero-area bounds, which fitBounds cannot
      // resolve at all. Two properties in the same building would do it.
      if (north === south && east === west) {
        map.setView([north, east], CIRCLE_READABLE_ZOOM);
        return;
      }

      // maxZoom does the rest of the work: properties spread across the
      // country fit normally, and two a few hundred metres apart stop at the
      // zoom where their circles still read as circles rather than filling
      // the frame. No special case needed for "close together".
      map.fitBounds(latLngBounds([south, west], [north, east]), {
        padding: [48, 48],
        maxZoom: CIRCLE_READABLE_ZOOM,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [items, map]);

  return null;
}

/**
 * Does this visitor have a precise pointing device, i.e. a mouse or trackpad?
 *
 * `(pointer: fine)` rather than a width breakpoint. Width is a proxy for
 * input, and a bad one: a touchscreen laptop is wide, and a desktop window
 * dragged narrow is not a phone. The question here is genuinely about input,
 * because the two behaviours being gated are wheel zoom and drag-to-pan.
 *
 * Read once, when the map mounts. The map only mounts on a deliberate tap, so
 * there is no meaningful window in which someone plugs in a mouse and expects
 * this to change underneath them.
 */
function useFinePointer(): boolean {
  // useSyncExternalStore rather than useState plus an effect: matchMedia is an
  // external store, which is exactly what this hook is for. It also makes the
  // value react to the pointer changing, which the effect version did not.
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(POINTER_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(POINTER_QUERY).matches,
    // Server snapshot. Never reached, because this component is loaded with
    // ssr: false, but assuming touch is the safer default if that changes.
    () => false
  );
}

export default function PropertyMap({ items }: { items: MappedProperty[] }) {
  const router = useRouter();
  const finePointer = useFinePointer();
  const centre: [number, number] = items.length
    ? [items[0].latitude, items[0].longitude]
    : [36.8, 10.2];

  return (
    <div className="w-full h-full [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:bg-black/5">
      <MapContainer
        center={centre}
        zoom={CIRCLE_READABLE_ZOOM}
        // Wheel zoom for anyone with a wheel to turn. On touch it stays off,
        // because there the equivalent gesture is the page scroll.
        scrollWheelZoom={finePointer}
        // Drag-to-pan only with a mouse. On touch, one finger must belong to
        // the page: a full-width map that answers a swipe by panning itself
        // traps the reader halfway down the page with no way past it.
        dragging={finePointer}
        // Pinch still works on touch, and pinching also pans, so the map is
        // not immovable there - it just will not take a one-finger swipe.
        touchZoom
        className="h-full w-full"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          // Required by the OpenStreetMap Foundation's tile usage policy, and
          // the right thing regardless: the basemap is their work.
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={17}
        />
        <FitToProperties items={items} />

        {items.map((p) => (
          <Circle
            key={p.id}
            center={[p.latitude, p.longitude]}
            radius={APPROX_RADIUS_METRES}
            pathOptions={{ color: "#000", weight: 2, fillColor: "#000", fillOpacity: 0.12 }}
            eventHandlers={{
              // router.push, not window.location: a full page reload would
              // discard the app shell and re-download everything.
              click: () => router.push(`/listings/${p.slug}`),
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent>
              <span className="text-[10px] font-bold uppercase tracking-[1px]">{p.price}</span>
            </Tooltip>
          </Circle>
        ))}
      </MapContainer>

      {/*
        The circles are canvas/SVG and are not reachable by keyboard, so the
        same destinations are listed here as ordinary links. Visually hidden,
        but in the tab order and read in full by a screen reader: the map is a
        convenience, and this is the route that always works.
      */}
      <div className="sr-only">
        <h3>Properties shown on the map</h3>
        <ul>
          {items.map((p) => (
            <li key={p.id}>
              <Link href={`/listings/${p.slug}`}>
                {p.name}, {p.category}, near {p.price}. Location shown approximately.
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
