In this project I’ve worked with a computational fluid flow simulation dataset from the San Diego Supercomputing Center and embedded the 3D point cloud on the web within a 2D visualisation and used few brushing and linking techniques to provide insights about the particles in the point cloud.
Three.js library has been used for this visualisation. A Particle system has been created from the dataset in the form of a cylinder and then colour mapped the point cloud by concentration of the particles in the system. A second view using d3 has been created to show a vertical slice of data and linked to the 3D view to provide a rectangular filter for the particles in the system. Users are provided with controls to move around the filter and observe the particles.
