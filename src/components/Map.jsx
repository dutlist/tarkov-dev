import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    TransformWrapper,
    TransformComponent,
} from 'react-zoom-pan-pinch';
import L from 'leaflet';

import { useMapImages } from '../features/maps';

import testMapData from '../data/maps_test.json';

import Time from './Time';
import SEO from './SEO';

import ErrorPage from './error-page';

const showTestMarkers = true;

function getCRS(mapData) {
    let scaleX = 1;
    let scaleY = 1;
    let marginX = 0;
    let marginY = 0;
    if (mapData) {    
        if (mapData.transform) {
            scaleX = mapData.transform[0];
            scaleY = mapData.transform[2] * -1;
            marginX = mapData.transform[1];
            marginY = mapData.transform[3];
        }
    }
    let transformation = new L.Transformation(scaleX, marginX, scaleY, marginY);
    return L.extend({}, L.CRS.Simple, {
        transformation: transformation,
    });
}

function getCoordinates(x, y, mapData) {
    if (!mapData.coordinateRotation) {
        return [y, x];
    }
    const angleInRadians = (mapData.coordinateRotation * Math.PI) / 180;
    const cosAngle = Math.cos(angleInRadians);
    const sinAngle = Math.sin(angleInRadians);

    const rotatedX = x * cosAngle - y * sinAngle;
    const rotatedY = x * sinAngle + y * cosAngle;
    return [rotatedY, rotatedX];
}

function Map() {
    let { currentMap } = useParams();

    const { t } = useTranslation();

    useEffect(() => {
        let viewableHeight = window.innerHeight - document.querySelector('.navigation')?.offsetHeight || 0;
        if (viewableHeight < 100) {
            viewableHeight = window.innerHeight;
        }

        document.documentElement.style.setProperty(
            '--display-height',
            `${viewableHeight}px`,
        );

        return function cleanup() {
            document.documentElement.style.setProperty(
                '--display-height',
                `auto`,
            );
        };
    });

    const ref = useRef();
    const mapRef = useRef(null);

    const onMapContainerRefChange = useCallback(node => {
        if (node) {
            let viewableHeight = window.innerHeight - document.querySelector('.navigation')?.offsetHeight || 0;
            if (viewableHeight < 100) {
                viewableHeight = window.innerHeight;
            }
            node.style.height = `${viewableHeight}px`;
        }
    }, []);

    useEffect(() => {
        ref?.current?.resetTransform();
    }, [currentMap]);

    let allMaps = useMapImages();

    const mapData = useMemo(() => {
        return allMaps[currentMap];
    }, [allMaps, currentMap]);

    useEffect(() => {
        if (!mapData || !mapData.tileSize) {
            return;
        }
        if (mapRef.current?._leaflet_id) {
            mapRef.current.remove();
        }
        const map = L.map('leaflet-map', {
            center: [0, 0],
            zoom: 2,
            scrollWheelZoom: true,
            crs: getCRS(mapData),
            attributionControl: false,
        });
        const legend = L.control.layers(null, null, {position: 'topleft'}).addTo(map);
        map.setMinZoom(mapData.minZoom);
        map.setMaxZoom(mapData.maxZoom);
        const baseLayer = L.tileLayer(mapData.mapPath || `https://assets.tarkov.dev/maps/${mapData.normalizedName}/{z}/{x}/{y}.png`, {tileSize: mapData.tileSize});
        baseLayer.addTo(map);
        if (showTestMarkers && testMapData[mapData.normalizedName]?.markers) {
            const markers = testMapData[mapData.normalizedName].markers;
            const markerLayer = L.layerGroup();
            for (const m of markers) {
                L.marker(getCoordinates(m.position.x, m.position.z, mapData))
                    .bindPopup(L.popup().setContent(`${m.name}<br>${JSON.stringify(m.position)}`))
                    .addTo(markerLayer);
            }
            if (markers.length > 0) {
                markerLayer.addTo(map);
                legend.addOverlay(markerLayer, t('Markers'));
            }
        }
        if (showTestMarkers && testMapData[mapData.normalizedName]?.spawns) {
            const spawns = testMapData[mapData.normalizedName]?.spawns;
            const spawnLayer = L.layerGroup();
            for (const spawn of spawns) {
                let bosses = [];
                let color = '#3388ff';
                if (!spawn.sides.includes('pmc') && spawn.sides.includes('scav')) {
                    color = '#ff3333';
                }
                if (spawn.categories.includes('boss')) {
                    bosses = mapData.bosses.filter(boss => boss.spawnLocations.some(sl => sl.spawnKey === spawn.zoneName));
                    if (bosses.length > 0) {
                        color = '#eb33ff';
                    }
                }
                if (spawn.sides.includes('all')) {
                    //color = '#ffa033';
                }
                L.circle(getCoordinates(spawn.position.x, spawn.position.z, mapData), {
                    radius: 5,
                    color,
                }).bindPopup(L.popup().setContent(`${spawn.zoneName}<br>${bosses.map(boss => boss.name).join(', ')}<br>${spawn.sides.join(', ')}<br>${spawn.categories.join(', ')}`)).addTo(spawnLayer);
            }
            if (spawns.length > 0) {
                spawnLayer.addTo(map);
                legend.addOverlay(spawnLayer, t('Spawns'));
            }
        }
        if (mapData.layers) {
            for (const layer of mapData.layers) {
                const tileLayer = L.tileLayer(layer.path, {tileSize: mapData.tileSize});
                legend.addOverlay(tileLayer, t(layer.name));
                if (layer.show) {
                    tileLayer.addTo(map);
                }
            }
        } 
        const zeroPoint = L.point(0, 0);
        map.panTo([zeroPoint.y, zeroPoint.x]);
        mapRef.current = map;
    }, [mapData, mapRef, t]);
    
    if (!mapData) {
        return <ErrorPage />;
    }

    return [
        <SEO 
            title={`${mapData.displayText} - ${t('Escape from Tarkov')} - ${t('Tarkov.dev')}`}
            description={mapData.description}
            image={`${window.location.origin}${process.env.PUBLIC_URL}${mapData.imageThumb}`}
            card='summary_large_image'
            key="seo-wrapper"
        />,
        <div className="display-wrapper" key="map-wrapper">
            <Time
                currentMap={currentMap}
                normalizedName={mapData.normalizedName}
                duration={mapData.duration}
                players={mapData.players}
                author={mapData.author}
                authorLink={mapData.authorLink}
            />
            {mapData.projection !== 'interactive' && (<TransformWrapper
                ref={ref}
                initialScale={1}
                centerOnInit={true}
                wheel={{
                    step: 0.1,
                }}
            >
                <TransformComponent>
                    <div className="map-image-wrapper">
                        <img
                            alt={`${mapData.displayText} ${t('Map')}`}
                            loading="lazy"
                            className="map-image"
                            title={`${mapData.displayText} ${t('Map')}`}
                            src={`${process.env.PUBLIC_URL}${mapData.image}`}
                        />
                    </div>
                </TransformComponent>
            </TransformWrapper>)}
            {mapData.projection === 'interactive' && (<div id="leaflet-map" ref={onMapContainerRefChange}  style={{height: '500px', backgroundColor: 'transparent'}}/>)}
        </div>,
    ];
}
export default Map;
