type endPointKeys = {
  [key: string]: string;
}

export const endpoints: endPointKeys = {
  auth: "Api/Client/Login",
  register: "Api/Client/Register",
  refreshToken: "Api/Auth/RefreshToken",
  
  getAllWords: "Api/Client/GetAllWords",
  addWord: "Api/Client/AddWord", 
  updateWord: "Api/Client/EditWord/{%}",
  deleteWord: "Api/Client/DeleteWord/{%}",
  
  getAllCountries: "all",
};
