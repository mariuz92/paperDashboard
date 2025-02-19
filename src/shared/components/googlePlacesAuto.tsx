import React, { useEffect, useState } from "react";
import { useLoadScript, StandaloneSearchBox } from "@react-google-maps/api";
import { Input } from "antd";
import { EUROPE_BOUNDS, GOOGLE_MAPS_API_KEY } from "../utils/googleMaps";

interface AutocompleteProps {
  disabled?: boolean;
  placeholder: string;
  onPlaceSelect: (address: string) => void;
  initialValue?: string; // Default to empty string if not provided
}

const LIBRARIES: ("places" | "maps")[] = ["places", "maps"]; // ✅ Static Array

const GooglePlacesAutocomplete: React.FC<AutocompleteProps> = ({
  placeholder,
  onPlaceSelect,
  disabled,
  initialValue = "", // ✅ Default to empty string if not provided
}) => {
  const [searchBox, setSearchBox] =
    useState<google.maps.places.SearchBox | null>(null);
  const [inputValue, setInputValue] = useState<string>(initialValue);

  // ✅ Load Google Maps only once using `useLoadScript`
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
    language: "it",
  });

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  const handlePlacesChanged = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        const address = place.formatted_address || "";
        setInputValue(address);
        onPlaceSelect(address);
      }
    }
  };

  if (loadError) return <p>Errore nel caricamento della mappa</p>;
  if (!isLoaded) return <p>Caricamento mappa...</p>;

  return (
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
        disabled={disabled}
      />
    </StandaloneSearchBox>
  );
};

export default GooglePlacesAutocomplete;
