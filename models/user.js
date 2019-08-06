module.exports = (sequelize, DataTypes) => {
  const { STRING, DATE, BOOLEAN } = DataTypes;

  const User = sequelize.define('user', {
    username: {
      type: STRING(20),
      allowNull: false,
      unique: true,
    },
    password: {
      type: STRING(100),
      allowNull: false,
    },
    email: {
      type: STRING(255),
      allowNull: false,
    },
    avatarUrl: {
      type: STRING(255),
    },
    statusMessage: {
      type: STRING(255),
    },
    isOnline: {
      type: BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lastOnline: {
      type: DATE,
    },
  }, {
    charset: 'utf8',
    collate: 'utf8_general_ci',
    timestamps: true,
    paranoid: true,
    underscored: true,
  });

  User.associate = (db) => {
    db.User.hasMany(db.Post, { as: 'posts' });
    db.User.hasMany(db.Comment);
    db.User.belongsToMany(db.User, { through: 'follows', as: 'followers', foreignKey: 'following_id' });
    db.User.belongsToMany(db.User, { through: 'follows', as: 'followings', foreignKey: 'follower_id' });
    db.User.belongsToMany(db.Post, { through: 'likes', as: 'liked' });
  };
  return User;
};
