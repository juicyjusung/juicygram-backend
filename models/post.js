module.exports = (sequelize, DataTypes) => {
  const { TEXT } = DataTypes;

  const Post = sequelize.define('post', {
    content: {
      type: TEXT,
      allowNull: false,
    }
  }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    timestamps: true,
    paranoid: true,
    underscored: true,
  });

  Post.associate = (db) => {
    db.Post.belongsTo(db.User);
    db.Post.hasMany(db.Comment);
    db.Post.hasMany(db.Image);
    db.Post.belongsToMany(db.Hashtag, { through: 'post_hashtags' });
    db.Post.belongsToMany(db.User, { through: 'likes', as: 'likers' });

  };
  return Post;
};