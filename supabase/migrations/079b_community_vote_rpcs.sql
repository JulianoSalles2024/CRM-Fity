create or replace function increment_post_upvotes(post_id uuid, delta int)
returns void language plpgsql security definer as $$
begin
  update community_posts set upvotes = upvotes + delta where id = post_id;
end;
$$;

create or replace function increment_comment_upvotes(comment_id uuid, delta int)
returns void language plpgsql security definer as $$
begin
  update community_comments set upvotes = upvotes + delta where id = comment_id;
end;
$$;
