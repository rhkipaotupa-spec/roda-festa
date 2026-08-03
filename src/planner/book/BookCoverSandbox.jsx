import {
  useState,
} from "react";

import BookCover from "./BookCover";
import BookIdentityPage from "./BookIdentityPage";

export default function BookCoverSandbox() {
  const [
    isBookOpen,
    setIsBookOpen,
  ] = useState(false);

  const [
    planningData,
    setPlanningData,
  ] = useState({
    clientName: "",
    phone: "",
    eventDate: "",
  });

  function handleOpenBook() {
    setIsBookOpen(true);
  }

  function handleContinueIdentity(data) {
    setPlanningData(data);

    console.log(
      "Dados do planejamento:",
      data
    );
  }

  if (isBookOpen) {
    return (
      <BookIdentityPage
        initialData={planningData}
        onContinue={handleContinueIdentity}
      />
    );
  }

  return (
    <BookCover
      onOpen={handleOpenBook}
    />
  );
}