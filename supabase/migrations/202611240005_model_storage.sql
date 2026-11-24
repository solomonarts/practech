-- Private engineering model storage and storage object policies.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('engineering-models','engineering-models',false,157286400,array['model/stl','application/octet-stream','model/gltf-binary','model/gltf+json','application/zip'])
on conflict(id) do nothing;
create policy model_storage_staff_upload on storage.objects for insert to authenticated with check(bucket_id='engineering-models' and public.is_staff());
create policy model_storage_staff_update on storage.objects for update to authenticated using(bucket_id='engineering-models' and public.is_staff()) with check(bucket_id='engineering-models' and public.is_staff());
create policy model_storage_enrolled_read on storage.objects for select to authenticated using(bucket_id='engineering-models' and (public.is_staff() or exists(select 1 from public.model_assets a where a.storage_path=name and a.status='published' and public.student_enrolled_in(a.program_id))));

