import React, { useEffect, useState } from "react";
import { LoadScript, StandaloneSearchBox } from "@react-google-maps/api";
import { Input } from "antd";
import { EUROPE_BOUNDS, GOOGLE_MAPS_API_KEY } from "../utils/googleMaps";

interface AutocompleteProps {
  disabled?: boolean;
  placeholder: string;
  onPlaceSelect: (address: string) => void;
  initialValue: string; // default to empty string if not provided
}

const GooglePlacesAutocomplete: React.FC<AutocompleteProps> = ({
  placeholder,
  onPlaceSelect,
  disabled,
  initialValue = "", // default to empty string if not provided
}) => {
  const [searchBox, setSearchBox] =
    useState<google.maps.places.SearchBox | null>(null);

  const [inputValue, setInputValue] = useState<string>(initialValue);

  useEffect(() => {
    // If the initialValue changes (or on mount), sync local state
    setInputValue(initialValue);
  }, [initialValue]);

  const handlePlacesChanged = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        const address = place.formatted_address || "";
        setInputValue(address); // Update input field
        onPlaceSelect(address); // Callback to parent component
      }
    }
  };

  return (
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      libraries={["places", "maps"]}
      language="it"
    >
      <StandaloneSearchBox
        onLoad={(ref) => setSearchBox(ref)}
        onPlacesChanged={handlePlacesChanged}
        options={{
          bounds: EUROPE_BOUNDS,
        }}
      >
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
      </StandaloneSearchBox>
    </LoadScript>
  );
};

export default GooglePlacesAutocomplete;
