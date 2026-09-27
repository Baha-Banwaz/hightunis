"use client";

import { useEffect } from "react";
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

      if (items.length === 1) {
        map.setView([items[0].latitude, items[0].longitude], 11);
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

      // Several properties in one town give near-identical corners, which
      // fits to maximum zoom for the same reason as above.
      if (north - south < 0.02 && east - west < 0.02) {
        map.setView([(north + south) / 2, (east + west) / 2], 11);
        return;
      }

      map.fitBounds(latLngBounds([south, west], [north, east]), {
        padding: [48, 48],
        maxZoom: 12,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [items, map]);

  return null;
}

export default function PropertyMap({ items }: { items: MappedProperty[] }) {
  const router = useRouter();
  const centre: [number, number] = items.length
    ? [items[0].latitude, items[0].longitude]
    : [36.8, 10.2];

  return (
    <div className="w-full h-full [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:bg-black/5">
      <MapContainer
        center={centre}
        zoom={9}
        scrollWheelZoom={false}
        // One finger scrolls the page; two fingers pan the map. Without this a
        // full-width map on a phone swallows the scroll and traps the reader.
        dragging={typeof window !== "undefined" && window.innerWidth >= 768}
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
