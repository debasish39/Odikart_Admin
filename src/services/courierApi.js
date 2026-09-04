import adminApi from "./adminApi";

/*
|--------------------------------------------------------------------------
| GET ALL COURIERS
|--------------------------------------------------------------------------
*/

export const getCouriers = async () => {
  const response = await adminApi.get("/couriers");

  return response.data;
};


/*
|--------------------------------------------------------------------------
| GET SINGLE COURIER
|--------------------------------------------------------------------------
*/

export const getCourierById = async (id) => {
  const response = await adminApi.get(`/couriers/${id}`);

  return response.data;
};