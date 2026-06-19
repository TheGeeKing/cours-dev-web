"use client";

import "leaflet/dist/leaflet.css";
import "react-leaflet-markercluster/styles";

import L from "leaflet";
import { useEffect, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";

import type { MapPoint } from "@/features/map/model/map.types";

const franceCenter = { lat: 46.6, lng: 2.4 };

L.Icon.Default.mergeOptions({
	iconRetinaUrl:
		"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
	iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
	shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export function MapCanvas({ points }: { points: MapPoint[] }) {
	return (
		<div className="min-h-[32rem] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
			<MapContainer
				center={franceCenter}
				className="h-[32rem] w-full"
				scrollWheelZoom={true}
				zoom={6}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<MarkerClusterGroup
					chunkedLoading
					showCoverageOnHover={false}
					spiderfyOnMaxZoom
					zoomToBoundsOnClick
				>
					{points.map((point) => (
						<MuseumMarker key={point.id} point={point} />
					))}
				</MarkerClusterGroup>
				<FitBoundsOnce points={points} />
			</MapContainer>
		</div>
	);
}

function MuseumMarker({ point }: { point: MapPoint }) {
	return (
		<Marker
			eventHandlers={{
				add: (event) => {
					event.target.bindPopup(buildPopupHtml(point), { maxWidth: 280 });
				},
			}}
			position={[point.lat, point.lng]}
		/>
	);
}

function FitBoundsOnce({ points }: { points: MapPoint[] }) {
	const map = useMap();
	const hasFittedRef = useRef(false);

	useEffect(() => {
		if (points.length === 0) {
			hasFittedRef.current = false;
			map.setView(franceCenter, 6);
			return;
		}

		if (hasFittedRef.current) {
			return;
		}

		hasFittedRef.current = true;

		if (points.length === 1) {
			const point = points[0];
			if (!point) {
				return;
			}
			map.setView([point.lat, point.lng], 12);
			return;
		}

		const bounds = computeBounds(points);
		if (bounds) {
			map.fitBounds(bounds, { padding: [24, 24] });
		}
	}, [map, points]);

	return null;
}

function computeBounds(points: MapPoint[]) {
	let minLat = Number.POSITIVE_INFINITY;
	let maxLat = Number.NEGATIVE_INFINITY;
	let minLng = Number.POSITIVE_INFINITY;
	let maxLng = Number.NEGATIVE_INFINITY;

	for (const point of points) {
		minLat = Math.min(minLat, point.lat);
		maxLat = Math.max(maxLat, point.lat);
		minLng = Math.min(minLng, point.lng);
		maxLng = Math.max(maxLng, point.lng);
	}

	if (
		!Number.isFinite(minLat) ||
		!Number.isFinite(maxLat) ||
		!Number.isFinite(minLng) ||
		!Number.isFinite(maxLng)
	) {
		return null;
	}

	return L.latLngBounds([minLat, minLng], [maxLat, maxLng]);
}

function buildPopupHtml(point: MapPoint) {
	const websiteLink = point.url
		? `<br /><a href="${escapeHtml(point.url)}" target="_blank" rel="noreferrer">Voir le site</a>`
		: "";

	return `
		<div style="font-size: 0.875rem; line-height: 1.5;">
			<strong>${escapeHtml(point.name)}</strong>
			<br />
			${escapeHtml(point.city)} · ${escapeHtml(point.department)}
			<br />
			${escapeHtml(point.category)}
			${websiteLink}
		</div>
	`;
}

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}
