import React, { useState } from "react";
import { LoadScript, StandaloneSearchBox } from "@react-google-maps/api";
import { Input } from "antd";
import { EUROPE_BOUNDS, GOOGLE_MAPS_API_KEY } from "../utils/googleMaps";

interface AutocompleteProps {
  placeholder: string;
  onPlaceSelect: (address: string) => void;
}

const GooglePlacesAutocomplete: React.FC<AutocompleteProps> = ({
  placeholder,
  onPlaceSelect,
}) => {
  const [searchBox, setSearchBox] =
    useState<google.maps.places.SearchBox | null>(null);

  const handlePlacesChanged = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        onPlaceSelect(place.formatted_address || "");
      }
    }
  };

  return (
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      libraries={["places", "maps"]}
    >
      <StandaloneSearchBox
        onLoad={(ref) => setSearchBox(ref)}
        onPlacesChanged={handlePlacesChanged}
        options={{
          bounds: EUROPE_BOUNDS,
        }}
      >
        <Input placeholder={placeholder} />
      </StandaloneSearchBox>
    </LoadScript>
  );
};

export default GooglePlacesAutocomplete;
