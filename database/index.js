/* eslint-disable no-shadow */
/* eslint-disable no-console */
const mysql = require('mysql');

const mysqlConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'trailr',
};

const connection = mysql.createConnection(mysqlConfig);

const getUser = (idGoogle) => new Promise((resolve, reject) => {
  console.log('GET USER INVOKED');

  const getUserCommand = `
    SELECT *
    FROM users
    WHERE id_google = ?
  `;
  const getPhotosCommand = `
    SELECT *
    FROM photos
    WHERE id_user = ?
  `;
  const getCommentsCommand = `
    SELECT comments.*, users.*
    FROM comments
    LEFT JOIN users ON comments.id_user = users.id
    WHERE id_photo = ?
  `;

  connection.beginTransaction((error) => {
    if (error) {
      connection.rollback(() => {
        connection.release();
        return reject(error);
      });
    }
    connection.query(getUserCommand, [idGoogle], (error, gottenUser) => {
      if (error) { // maybe || rows.length > 1 OR separate error to handle more than one result?
        connection.rollback(() => {
          connection.release();
          return reject(error);
        });
      }
      const user = gottenUser[0];
      const { id } = user;
      connection.query(getPhotosCommand, [id], (error, gottenPhotos) => {
        if (error) {
          connection.rollback(() => {
            connection.release();
            return reject(error);
          });
        }
        user.photos = gottenPhotos;
        user.photos.forEach((photo, i) => {
          const { id } = photo;
          connection.query(getCommentsCommand, [id], (error, gottenComments) => {
            if (error) {
              connection.rollback(() => {
                connection.release();
                return reject(error);
              });
            }
            user.photos[i].comments = gottenComments;
            if (i === user.photos.length - 1) {
              connection.commit((error) => {
                if (error) {
                  connection.rollback(() => {
                    connection.release();
                    return reject(error);
                  });
                }
                resolve(user);
              });
            }
          });
        });
      });
    });
  });
});

const addUser = (userObject) => new Promise((resolve, reject) => {
  console.log('ADD USER INVOKED');

  const { idGoogle, name, profilePhotoUrl } = userObject;

  const checkUserCommand = `
    SELECT *
    FROM users
    WHERE id_google = ?
  `;
  const addUserCommand = `
    INSERT INTO users (id_google, name, profile_photo_url)
    VALUES (?, ?, ?)
  `;

  connection.beginTransaction((error) => {
    if (error) {
      connection.rollback(() => {
        connection.release();
        return reject(error);
      });
    }
    connection.query(checkUserCommand, [idGoogle], (error, userResult) => {
      if (error) {
        connection.rollback(() => {
          connection.release();
          return reject(error);
        });
      }
      if (userResult.length === 0) {
        connection.query(addUserCommand,
          [idGoogle, name, profilePhotoUrl],
          (error, addedUser) => {
            if (error) {
              connection.rollback(() => {
                connection.release();
                return reject(error);
              });
            }
            connection.commit((error) => {
              if (error) {
                connection.rollback(() => {
                  connection.release();
                  return reject(error);
                });
              }
              resolve(addedUser, console.log('USER SUCCESSFULLY ADDED'));
            });
          });
      } else if (userResult.length > 0) {
        if (error) {
          connection.rollback(() => {
            connection.release();
            return reject(error);
          });
        }
        resolve('User already exists.');
      }
    });
  });
});

const getTrail = (/* idTrail, idUser */trailObject) => new Promise((resolve, reject) => {
  console.log('GET TRAIL INVOKED');

  const { idTrail, idUser } = trailObject; // TO CHANGE TO OBJ PARAMETERS

  const getTrailCommand = `
    SELECT *,
    (
      SELECT ROUND(AVG(value), 1)
      FROM rating_difficulty
      WHERE id_trail = ?
    ) AS averageDifficulty,
    (
      SELECT ROUND(AVG(value), 1)
      FROM rating_likeability
      WHERE id_trail = ?
    ) AS averageLikeability,
    (
      SELECT value
      FROM rating_difficulty
      WHERE id_user = ?
      AND id_trail = ?
    ) as userDifficulty,
    (
      SELECT value
      FROM rating_likeability
      WHERE id_user = ?
      AND id_trail = ?
    ) as userLikeability
    FROM trails
    WHERE id = ?
  `;

  const getPhotosCommand = `
    SELECT users.*, photos.*
    FROM photos
    LEFT JOIN users ON photos.id_user = users.id
    LEFT JOIN trails ON photos.id_trail = trails.id
    WHERE trails.id = ?
  `;

  const getCommentsCommand = `
    SELECT comments.*, users.*
    FROM comments
    LEFT JOIN users ON comments.id_user = users.id
    WHERE id_photo = ?
  `;

  connection.beginTransaction((error) => {
    if (error) {
      connection.rollback(() => {
        connection.release();
        return reject(error);
      });
    }
    connection.query(getTrailCommand,
      [idTrail, idTrail, idUser, idTrail, idUser, idTrail, idTrail],
      (error, gottenTrail) => {
        if (error) {
          connection.rollback(() => {
            connection.release();
            return reject(error);
          });
        }
        const trail = gottenTrail[0];
        const { id } = trail;
        connection.query(getPhotosCommand, [id], (error, gottenPhotos) => {
          if (error) {
            connection.rollback(() => {
              connection.release();
              return reject(error);
            });
          }
          if (!gottenPhotos.length) {
            connection.commit((error) => {
              if (error) {
                connection.rollback(() => {
                  connection.release();
                  return reject(error);
                });
              }
              resolve(trail);
            });
          }
          trail.photos = gottenPhotos;
          trail.photos.forEach((photo, i) => {
            const { id } = photo;
            connection.query(getCommentsCommand, [id], (error, gottenComments) => {
              if (error) {
                connection.rollback(() => {
                  connection.release();
                  return reject(error);
                });
              }
              trail.photos[i].comments = gottenComments;
              if (i === trail.photos.length - 1) {
                connection.commit((error) => {
                  if (error) {
                    connection.rollback(() => {
                      connection.release();
                      return reject(error);
                    });
                  }
                  resolve(trail);
                });
              }
            });
          });
        });
      });
  });
});

const addTrail = (trailObject) => new Promise((resolve, reject) => {
  const { idTrail } = trailObject;
  const addTrailCommand = '';
  connection.beginTransaction((error) => {
    if (error) {
      connection.rollback(() => {
        connection.release();
        return reject(error);
      });
    }
    connection.query(addTrailCommand, [idTrail], (error, rows) => {
      if (error) {
        connection.rollback(() => {
          connection.release();
          return reject(error);
        });
      }
      connection.commit((error) => {
        if (error) {
          connection.rollback(() => {
            connection.release();
            return reject(error);
          });
        }
        resolve(console.log('ADD TRAIL INVOKED', rows));
      });
    });
  });
});

const updateTrail = (trailObject) => new Promise((resolve, reject) => {
  console.log('UPDATE TRAIL INVOKED');
  const { idTrail } = trailObject;
  const updateTrailCommand = '';
  connection.beginTransaction((error) => {
    if (error) {
      connection.rollback(() => {
        connection.release();
        return reject(error);
      });
    }
    connection.query(updateTrailCommand, [idTrail], (error, rows) => {
      if (error) {
        connection.rollback(() => {
          connection.release();
          return reject(error);
        });
      }
      connection.commit((error) => {
        if (error) {
          connection.rollback(() => {
            connection.release();
            return reject(error);
          });
        }
        resolve(console.log('UPDATE TRAIL INVOKED', rows));
      });
    });
  });
});

const deleteTrail = (trailObject) => new Promise((resolve, reject) => {
  const { idTrail } = trailObject;
  const deleteTrailCommand = '';
  connection.beginTransaction((error) => {
    if (error) {
      connection.rollback(() => {
        connection.release();
        return reject(error);
      });
    }
    connection.query(deleteTrailCommand, [idTrail], (error, rows) => {
      if (error) {
        connection.rollback(() => {
          connection.release();
          return reject(error);
        });
      }
      connection.commit((error) => {
        if (error) {
          connection.rollback(() => {
            connection.release();
            return reject(error);
          });
        }
        resolve(console.log('DELETE TRAIL INVOKED', rows));
      });
    });
  });
});

const updateDifficulty = (difficultyObject) => new Promise((resolve, reject) => {
  console.log('UPDATE DIFFICULTY INVOKED');

  const { idUser, idTrail, value } = difficultyObject;

  const checkDifficultyCommand = `
    SELECT *
    FROM rating_difficulty
    WHERE id_user = ? AND id_trail = ?
  `;

  const addDifficultyCommand = `
    INSERT INTO rating_difficulty (id_user, id_trail, value)
    VALUES (?, ?, ?)
  `;

  const updateDifficultyCommand = `
    UPDATE rating_difficulty
    SET value = ?
    WHERE id_user = ? AND id_trail = ?
  `;

  connection.beginTransaction((error) => {
    if (error) {
      connection.rollback(() => {
        connection.release();
        return reject(error);
      });
    }
    connection.query(checkDifficultyCommand,
      [idUser, idTrail, value],
      (error, difficultyResult) => {
        if (error) {
          connection.rollback(() => {
            connection.release();
            return reject(error);
          });
        }
        if (difficultyResult.length === 0) {
          connection.query(addDifficultyCommand,
            [idUser, idTrail, value], (error, addedDifficulty) => {
              if (error) {
                connection.rollback(() => {
                  connection.release();
                  return reject(error);
                });
              }
              connection.commit((error) => {
                if (error) {
                  connection.rollback(() => {
                    connection.release();
                    return reject(error);
                  });
                }
                resolve(addedDifficulty, console.log('DIFFICULTY ADDED'));
              });
            });
        } else if (difficultyResult.length > 0) {
          connection.query(updateDifficultyCommand,
            [value, idUser, idTrail],
            (error, updatedDifficulty) => {
              if (error) {
                connection.rollback(() => {
                  connection.release();
                  return reject(error);
                });
              }
              connection.commit((error) => {
                if (error) {
                  connection.rollback(() => {
                    connection.release();
                    return reject(error);
                  });
                }
                resolve(updatedDifficulty, console.log('DIFFICULTY UPDATED'));
              });
            });
        }
      });
  });
});

const updateLikeability = (likeabilityObject) => new Promise((resolve, reject) => {
  console.log('UPDATE LIKEABILITY INVOKED');

  const { idUser, idTrail, value } = likeabilityObject;

  const checkLikeabilityCommand = `
    SELECT *
    FROM rating_likeability
    WHERE id_user = ? AND id_trail = ?
  `;

  const addLikeabilityCommand = `
    INSERT INTO rating_likeability (id_user, id_trail, value)
    VALUES (?, ?, ?)
  `;

  const updateLikeabilityCommand = `
    UPDATE rating_likeability
    SET value = ?
    WHERE id_user = ? AND id_trail = ?
  `;

  connection.beginTransaction((error) => {
    if (error) {
      connection.rollback(() => {
        connection.release();
        return reject(error);
      });
    }
    connection.query(checkLikeabilityCommand,
      [idUser, idTrail, value],
      (error, likeabilityResult) => {
        if (error) {
          connection.rollback(() => {
            connection.release();
            return reject(error);
          });
        }
        if (likeabilityResult.length === 0) {
          connection.query(addLikeabilityCommand,
            [idUser, idTrail, value], (error, addedLikeability) => {
              if (error) {
                connection.rollback(() => {
                  connection.release();
                  return reject(error);
                });
              }
              connection.commit((error) => {
                if (error) {
                  connection.rollback(() => {
                    connection.release();
                    return reject(error);
                  });
                }
                resolve(addedLikeability, console.log('LIKEABILITY ADDED'));
              });
            });
        } else if (likeabilityResult.length > 0) {
          connection.query(updateLikeabilityCommand,
            [value, idUser, idTrail],
            (error, updatedLikeability) => {
              if (error) {
                connection.rollback(() => {
                  connection.release();
                  return reject(error);
                });
              }
              connection.commit((error) => {
                if (error) {
                  connection.rollback(() => {
                    connection.release();
                    return reject(error);
                  });
                }
                resolve(updatedLikeability, console.log('LIKEABILITY UPDATED'));
              });
            });
        }
      });
  });
});

module.exports = {
  getUser,
  addUser,
  getTrail,
  addTrail,
  updateTrail,
  deleteTrail,
  updateDifficulty,
  updateLikeability,
};

// mysql -uroot < server/index.js
// mysql.server start
