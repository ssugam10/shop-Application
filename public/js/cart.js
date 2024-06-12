const changeQty = (btn) => {
  const prodId = btn.parentNode.querySelector("[name=productId]").value;
  const csrf = btn.parentNode.querySelector("[name=_csrf]").value;

  const currQty = +btn.parentNode.querySelector("h2").innerHTML.split(" ")[1];
  const quantityElement = btn.parentNode.querySelector("h2");

  let updatedValue;
  if (btn.innerHTML == "+") {
    updatedValue = currQty + 1;
  } else {
    updatedValue = currQty - 1;
  }

  fetch("/cart/" + prodId, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "csrf-token": csrf,
    },
    body: JSON.stringify({
      updatedValue: updatedValue,
    }),
  })
    .then((result) => result.json())
    .then((data) => {
      console.log(data);
      if (data.redirect) {
        window.location.href = "/";
        console.log(
          "Since quantity was 0, product was removed and you got redirected!"
        );
      } else {
        quantityElement.innerHTML = `Quantity: ${updatedValue}`;
      }
    })
    .catch((err) => console.log(err));
};
