module.exports = (sequelize, DataTypes) => {
  const { STRING } = DataTypes;

  const Hashtag = sequelize.define('hashtag', {
    name: {
      type: STRING(20),
      allowNull: false,
    },
  }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    timestamps: true,
    underscored: true,
  });

  Hashtag.associate = (db) => {
    db.Hashtag.belongsToMany(db.Post, { through: 'post_hashtags' });
  };
  return Hashtag;
};
