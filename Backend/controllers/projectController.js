import Project from "../models/Project.js";

const getProjects = async (req, res) => {
  //  return json message
  return res.status(200).json("yes");
};

export { getProjects };
