module.exports = (sequelize, DataTypes) => {
  const { TEXT } = DataTypes;

  const Comment = sequelize.define('comment', {
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

  Comment.associate = (db) => {
    db.Comment.belongsTo(db.User);
    db.Comment.belongsTo(db.Post);
  };
  return Comment;
};